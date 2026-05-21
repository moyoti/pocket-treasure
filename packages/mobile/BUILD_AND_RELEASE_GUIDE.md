# 📦 寻宝记 - 完整打包发布指南

本文档提供从开发到发布的完整打包流程，涵盖 Android 和 iOS 平台。

---

## 📋 目录

- [Android 本地测试打包](#android-本地测试打包)
- [Android Google Play 发布](#android-google-play-发布)
- [iOS 本地测试打包](#ios-本地测试打包)
- [iOS App Store 发布](#ios-app-store-发布)
- [版本管理策略](#版本管理策略)
- [发布检查清单](#发布检查清单)
- [故障排除](#故障排除)

---

## 🤖 Android 本地测试打包

### 方式一：快速构建 APK（推荐用于本地测试）

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile

# 构建 Debug APK（快速，用于开发测试）
yarn android:debug

# 构建 Release APK（用于真机测试）
yarn android:release
```

**输出位置**：
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

**安装到模拟器/真机**：
```bash
# 检查设备
adb devices

# 安装 APK
adb install -r packages/mobile/android/app/build/outputs/apk/release/app-release.apk

# 启动应用
adb shell monkey -p com.treasurecat.app -c android.intent.category.LAUNCHER 1
```

### 方式二：使用 Expo EAS Build（推荐用于 CI/CD）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账户
eas login

# 配置 EAS Build
eas build:configure

# 构建 Android APK（内测分发）
eas build --platform android --profile preview

# 构建 Android AAB（Google Play 发布）
eas build --platform android --profile production
```

**查看构建状态**：
```bash
eas build:list
```

**下载构建产物**：
```bash
eas build:download --platform android --latest
```

---

## 🚀 Android Google Play 发布

### 前置要求

1. **Google Play Console 账户** - 已注册开发者账户
2. **服务账号密钥** - 放置在项目根目录 `.play-store-key.json`
3. **应用已创建** - 在 Google Play Console 中创建了应用

### 一键部署（推荐）

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile

# 自动完成：获取版本号 → 递增 versionCode → 构建 AAB → 上传到内测轨道
yarn deploy:playstore
```

**自动化流程**：
1. ✅ 从 Google Play 获取最新版本号
2. ✅ 自动递增 versionCode (+1)
3. ✅ 构建 Release AAB (3-5 分钟)
4. ✅ 上传到 Google Play 内测轨道 (internal)
5. ✅ 创建发布（状态：draft，需手动审核）

**发布后操作**：
1. 访问：https://play.google.com/console/apps/com.treasurecat.app/releases/internal
2. 填写发布说明（中文/英文）
3. 审核并发布到内测轨道
4. 通知测试人员下载测试

### 手动部署（备用方案）

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile/android

# 1. 手动更新 versionCode（在 app/build.gradle 中）
# 2. 构建 AAB
./gradlew bundleRelease

# 3. 上传 AAB 到 Google Play Console
# 访问：https://play.google.com/console/apps/com.treasurecat.app/releases
```

**输出位置**：
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 发布轨道说明

| 轨道 | 用途 | 审核时间 | 用户范围 |
|------|------|----------|----------|
| **internal** | 内部测试 | 几分钟 | 最多 100 人 |
| **alpha** | 封闭测试 | 几小时 | 指定测试人员 |
| **beta** | 公开测试 | 1-2 天 | 所有用户可选 |
| **production** | 正式发布 | 1-7 天 | 所有用户 |

**建议流程**：
```
internal → alpha → beta → production
```

---

## 🍎 iOS 本地测试打包

### 方式一：使用 Expo Go（开发阶段）

```bash
# 启动 Expo 开发服务器
yarn dev:mobile

# 在 iOS 设备上：
# 1. 下载 Expo Go App
# 2. 扫描二维码
# 3. 应用自动加载
```

**优点**：
- 无需编译，即时预览
- 支持热重载
- 最适合开发调试

**缺点**：
- 需要 Expo Go 应用
- 无法测试原生功能

### 方式二：使用 EAS Build（推荐）

```bash
# 配置 iOS 证书（首次需要）
eas credentials

# 构建 iOS Simulator（用于模拟器测试）
eas build --platform ios --profile simulator

# 构建 iOS Archive（用于真机测试）
eas build --platform ios --profile preview

# 构建 iOS Archive（用于 App Store）
eas build --platform ios --profile production
```

**输出位置**：
- Simulator: `.app` 文件（拖入模拟器）
- Preview/Production: `.ipa` 文件

**安装到模拟器**：
```bash
# 下载构建产物
eas build:download --platform ios --latest

# 解压并安装到模拟器
unzip build.zip
xcrun simctl install booted build.app
```

**安装到真机（通过 TestFlight）**：
```bash
# 上传到 App Store Connect
eas submit --platform ios --latest
```

### 方式三：使用 Xcode（传统方式）

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile/ios

# 1. 打开 Xcode 项目
open TreasureCat.xcworkspace

# 2. 选择目标设备
# - 模拟器：选择任意 iPhone Simulator
# - 真机：选择你的设备

# 3. 构建并运行
# Product → Build (Cmd+B)
# Product → Run (Cmd+R)
```

**导出 IPA**：
1. Product → Archive
2. 在 Organizer 中点击 "Distribute App"
3. 选择 "Ad Hoc" 或 "App Store"
4. 导出 .ipa 文件

---

## 📱 iOS App Store 发布

### 前置要求

1. **Apple Developer 账户** - 年费 $99
2. **App Store Connect 中创建应用**
3. **证书和描述文件** - EAS 自动管理或手动配置

### 使用 EAS Submit（推荐）

```bash
# 构建并上传到 App Store Connect
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### 手动上传

```bash
# 1. 在 Xcode 中 Archive
# Product → Archive

# 2. 上传到 App Store Connect
# Organizer → Distribute App → App Store

# 3. 在 App Store Connect 中提交审核
# https://appstoreconnect.apple.com
```

### 提交审核检查清单

- [ ] 应用图标和截图（6.5" 和 5.5" 屏幕）
- [ ] 应用描述（中英文）
- [ ] 关键词
- [ ] 隐私政策 URL
- [ ] 支持 URL
- [ ] 分级信息
- [ ] 内购项目（如有）
- [ ] 测试账号（如需要登录）

**审核时间**：通常 24-48 小时

---

## 📊 版本管理策略

### Version Code / Build Number

**Android (versionCode)**：
- 整数，每次发布 +1
- 位置：`android/app/build.gradle`
- 自动化：`yarn deploy:playstore` 自动递增

**iOS (CFBundleVersion)**：
- 整数，每次发布 +1
- 位置：`app.json` → `ios.buildNumber`
- 自动化：EAS Build 自动递增

### Version Name / Version Number

**通用 (versionName / CFBundleShortVersionString)**：
- 语义化版本：`MAJOR.MINOR.PATCH`
- 位置：`app.json` → `version`
- 手动更新

**版本规则**：
- **MAJOR**：重大功能更新/破坏性变更 (1.0.0 → 2.0.0)
- **MINOR**：新功能发布 (1.0.0 → 1.1.0)
- **PATCH**：Bug 修复/小改进 (1.0.0 → 1.0.1)

### 更新版本号

```bash
# 手动编辑 app.json
{
  "expo": {
    "version": "1.0.1",  // ← 更新这里
    "ios": {
      "buildNumber": "12"  // ← iOS build number
    },
    "android": {
      "versionCode": 12  // ← Android versionCode
    }
  }
}
```

**或使用脚本**：
```bash
# 更新 PATCH 版本 (1.0.0 → 1.0.1)
npm version patch

# 更新 MINOR 版本 (1.0.0 → 1.1.0)
npm version minor

# 更新 MAJOR 版本 (1.0.0 → 2.0.0)
npm version major
```

---

## ✅ 发布检查清单

### 发布前检查

#### 代码质量
- [ ] 所有功能已测试
- [ ] 无 `console.log` 在生产代码中
- [ ] 无 TypeScript 错误
- [ ] ESLint 检查通过
- [ ] 代码已提交到 git

#### 功能测试
- [ ] 登录/注册正常
- [ ] 地图显示正常
- [ ] 物品收集功能正常
- [ ] 本地化（中英文）正确
- [ ] 无崩溃问题

#### 性能检查
- [ ] 启动时间 < 3 秒
- [ ] 内存使用正常
- [ ] 网络请求优化
- [ ] 图片资源压缩

#### 元数据准备
- [ ] 应用图标（1024x1024）
- [ ] 截图（多种尺寸）
- [ ] 应用描述（中英文）
- [ ] 发布说明（本次更新内容）
- [ ] 关键词优化

### 发布后验证

#### Android (Google Play)
- [ ] 在 Google Play Console 确认上传成功
- [ ] 内测版本可下载
- [ ] 版本号正确
- [ ] 无崩溃报告

#### iOS (App Store)
- [ ] 在 App Store Connect 确认上传成功
- [ ] TestFlight 测试可用
- [ ] 审核状态正常
- [ ] 无崩溃报告

#### 监控
- [ ] 设置崩溃监控（Firebase Crashlytics / Sentry）
- [ ] 监控用户反馈
- [ ] 跟踪下载量和活跃度

---

## 🐛 故障排除

### Android 常见问题

#### 问题 1：APK 安装失败
```
INSTALL_FAILED_UPDATE_INCOMPATIBLE
```
**解决**：
```bash
# 卸载旧版本
adb uninstall com.treasurecat.app

# 重新安装
adb install -r app-release.apk
```

#### 问题 2：Version Code 冲突
```
Version code already exists
```
**解决**：
- 使用 `yarn deploy:playstore` 自动递增 versionCode
- 或手动在 `android/app/build.gradle` 中增加 versionCode

#### 问题 3：签名错误
```
You need to use a different signing key
```
**解决**：
- 确认 keystore 文件存在
- 检查 `android/gradle.properties` 中的签名配置
- 使用正确的 keystore 和密码

### iOS 常见问题

#### 问题 1：证书过期
```
No signing certificate found
```
**解决**：
```bash
# 重新配置证书
eas credentials
```

#### 问题 2：Bundle ID 冲突
```
Bundle ID already exists
```
**解决**：
- 确认 `app.json` 中的 `ios.bundleIdentifier` 唯一
- 在 App Store Connect 检查是否已存在相同 Bundle ID

#### 问题 3：构建超时
```
Build timed out
```
**解决**：
- 使用 EAS Build 云端构建（更稳定）
- 检查网络连接
- 清理本地缓存：`eas build:cancel`

### 通用问题

#### 问题：EAS Build 失败
**解决**：
```bash
# 查看构建日志
eas build:list
eas build:view <BUILD_ID>

# 本地模拟构建
eas build --platform android --local
```

#### 问题：Google Play 上传失败
**解决**：
- 检查 `.play-store-key.json` 文件存在
- 确认服务账号权限正确
- 等待 5-10 分钟让权限生效
- 检查网络连接

---

## 📚 相关文档

- [快速部署指南](./QUICK_DEPLOY.md) - Google Play 一键部署
- [Google Play 部署详解](./DEPLOY_TO_PLAYSTORE.md)
- [Play Store 密钥设置](./SETUP_PLAY_STORE_KEY.md)
- [Google Play 自动部署](./PLAY_STORE_AUTO_DEPLOY.md)
- [Expo EAS 文档](https://docs.expo.dev/eas/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## 🎯 最佳实践

### 1. 发布频率
- **开发版**：每天 1-2 次（internal 测试）
- **测试版**：每周 1-2 次（alpha/beta 测试）
- **正式版**：每 2-4 周 1 次（production 发布）

### 2. 版本控制
- 使用 git 标签标记每个发布版本
- 在 CHANGELOG.md 中记录所有变更
- 发布说明清晰描述新增功能和修复

### 3. 测试策略
- 开发阶段：Expo Go + 模拟器
- 内测阶段：APK + TestFlight（10-50 人）
- 公测阶段：Google Play Beta + TestFlight 公开（100-1000 人）
- 正式发布：全量发布

### 4. 回滚策略
- 保留上一个稳定版本的 APK/IPA
- 如遇严重问题，立即下架并回滚
- 在内部维护紧急修复分支

---

**最后更新**: 2026-05-21  
**维护者**: Treasure Cat Team
