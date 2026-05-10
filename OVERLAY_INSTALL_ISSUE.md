# 覆盖安装白屏问题解决方案

## 问题描述
覆盖安装（不卸载直接安装新版本 APK）后应用显示白屏。

## 根本原因

### 1. JavaScript Bundle 缓存不匹配 ⭐ 主要原因
**问题**: Metro bundler 的缓存与新的 native 代码不匹配
**表现**: 旧版本的 JS bundle 被加载，导致运行时错误

### 2. Gradle 构建缓存
**问题**: Android 构建系统使用了旧的中间文件
**表现**: 资源 ID 冲突或代码混淆错误

### 3. Expo 缓存
**问题**: `.expo` 目录包含旧的构建配置
**表现**: 打包配置不一致

## 解决方案

### 方案 A: 清理后重新构建（推荐）

```bash
# 使用清理脚本
./scripts/clean-android.sh

# 或者手动清理
cd packages/mobile/android
./gradlew clean
cd ../../..

rm -rf packages/mobile/android/app/build
rm -rf packages/mobile/android/.gradle
rm -rf packages/mobile/.expo

# 重新构建
cd packages/mobile/android && ./gradlew assembleRelease
```

### 方案 B: 卸载后安装（测试环境）

```bash
# 完全卸载应用（会清除数据）
adb uninstall com.treasurehunt.app

# 安装新版本
adb install -r packages/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### 方案 C: 清除应用数据（保留应用）

```bash
# 清除应用数据和缓存
adb shell pm clear com.treasurehunt.app

# 重新启动应用
adb shell am start -n com.treasurehunt.app/.MainActivity
```

## 预防措施

### 1. 版本号管理
确保每次发布新版本时增加 versionCode：

```json
// packages/mobile/app.json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2  // 每次发布递增
    }
  }
}
```

### 2. 数据库迁移策略
当前使用 `synchronize: true`（开发模式），生产环境应使用 migrations：

```typescript
// 未来改进：添加数据库版本控制
await databaseService.migrate(fromVersion, toVersion);
```

### 3. 缓存版本检测
在应用启动时检测代码版本变化：

```typescript
// 伪代码示例
const currentVersion = require('../package.json').version;
const storedVersion = await AsyncStorage.getItem('app_version');

if (currentVersion !== storedVersion) {
  // 版本变化，清理缓存
  await clearAllCaches();
  await AsyncStorage.setItem('app_version', currentVersion);
}
```

## 调试步骤

如果覆盖安装后出现白屏：

1. **查看日志**
```bash
adb logcat | grep -E "(ReactNativeJS|ERROR|FATAL)"
```

2. **检查是否 JS bundle 加载失败**
```bash
adb logcat | grep "bundle"
```

3. **检查数据库错误**
```bash
adb logcat | grep -i "sqlite\|database"
```

4. **检查初始化流程**
```bash
adb logcat | grep -E "\[P2P\]|initializ"
```

## 当前状态

✅ 已测试场景：
- 首次安装：正常工作
- 覆盖安装（相同版本）：正常工作
- 覆盖安装（清理缓存后）：正常工作

⚠️ 建议：
- 每次发布前执行清理脚本
- 生产环境添加版本检测逻辑
- 考虑添加数据库迁移系统
