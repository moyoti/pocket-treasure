# Google Play 自动部署系统

## 📦 已创建的文件

1. **scripts/publish-to-play-store.js** - 主脚本（获取版本号 + 构建 + 上传）
2. **scripts/get-latest-version.js** - 工具脚本（仅获取版本号）
3. **scripts/README_PLAY_STORE.md** - 详细文档
4. **PLAY_STORE_AUTO_DEPLOY.md** - 本文件（快速开始指南）

## 🚀 快速开始（10 分钟）

### 步骤 1：创建 Google Service Account（5 分钟）

访问：https://console.cloud.google.com/

1. 创建或选择项目
2. API 和服务 → 凭据 → 创建凭据 → 服务账号
3. 名称：`play-store-deploy`
4. 创建后，点击服务账号 → 密钥 → 添加密钥 → JSON
5. 保存下载的 JSON 文件到安全位置

### 步骤 2：配置 Google Play Console（3 分钟）

访问：https://play.google.com/console

1. 设置 → API 访问权限
2. 邀请服务账号邮箱（xxx@xxx.iam.gserviceaccount.com）
3. 授予权限：
   - ✅ 应用：查看应用信息
   - ✅ 发布：管理发布和轨道

### 步骤 3：安装依赖（1 分钟）

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile
yarn add googleapis --dev
```

### 步骤 4：设置环境变量（1 分钟）

编辑 `.env` 文件：
```bash
GOOGLE_SERVICE_ACCOUNT_KEY=/absolute/path/to/play-store-key.json
GOOGLE_PLAY_PACKAGE_NAME=com.treasurecat.app
```

### 步骤 5：测试（1 分钟）

```bash
# 获取最新版本号
node scripts/get-latest-version.js

# 自动构建并上传
node scripts/publish-to-play-store.js
```

## 📝 工作流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 从 Play Console 获取最新版本号 (例如：5)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. 递增版本号 (5 → 6)                                   │
│     更新 android/app/build.gradle                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. 构建 AAB 文件                                        │
│     ./gradlew bundleRelease                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. 上传到 Play Console 内测轨道                         │
│     状态：draft（需要手动审核发布）                      │
└─────────────────────────────────────────────────────────┘
```

## 🎯 使用示例

### 仅查看版本号
```bash
node scripts/get-latest-version.js
```

输出：
```
📱 Fetching version code for com.treasurecat.app (internal track)...
✅ Latest version code: 5
📈 Next version code should be: 6
```

### 完整流程
```bash
node scripts/publish-to-play-store.js
```

输出：
```
🚀 Starting Google Play Store auto-publish...
📱 Fetching latest version code...
✅ Latest version code in internal track: 5
📈 New version code will be: 6
📝 Updating versionCode from 5 to 6
✅ versionCode updated successfully
🔨 Building AAB...
✅ AAB built successfully
📤 Uploading AAB to Google Play Console...
✅ AAB uploaded successfully with version code: 6
🎉 Upload complete!
```

## ⚙️ 配置选项

### 切换发布轨道
编辑 `scripts/publish-to-play-store.js`：
```javascript
const TRACK = 'internal'; // 可选：internal, alpha, beta, production
```

### 修改包名
通过环境变量覆盖：
```bash
export GOOGLE_PLAY_PACKAGE_NAME=com.your.package.name
```

## 🔒 安全注意事项

- ⚠️ **不要**将服务账号密钥提交到 git
- ✅ 将密钥文件添加到 `.gitignore`
- ✅ 使用环境变量存储路径
- ✅ 在 CI/CD 中使用 Secrets 存储

## 🐛 常见问题

**Q: 404 Not Found**
A: 首次发布需要先手动上传一个 AAB 到 Play Console

**Q: Permission denied**
A: 确认服务账号已在 Play Console 中授予权限

**Q: Version code 冲突**
A: 脚本会自动处理，确保每次运行都递增

## 📚 更多文档

详细文档请查看：`scripts/README_PLAY_STORE.md`
