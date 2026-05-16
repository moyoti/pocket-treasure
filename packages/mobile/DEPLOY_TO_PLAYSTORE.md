# 🚀 一键部署到 Google Play

## 📦 自动化部署脚本

只需一条命令，自动完成：
- ✅ 获取 Google Play 最新版本号
- ✅ 自动递增 version code
- ✅ 构建 Release AAB
- ✅ 上传到 Google Play 内测轨道

## 🎯 使用方法

### 首次部署

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile

# 运行一键部署
yarn deploy:playstore
```

### 日常部署

每次需要发布新版本时，只需运行：

```bash
yarn deploy:playstore
```

就这么简单！🎉

## 📝 工作流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 连接 Google Play API                                │
│     获取当前最新版本号 (例如：5)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. 自动递增版本号 (5 → 6)                              │
│     更新 android/app/build.gradle                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. 构建 Release AAB                                    │
│     执行：./gradlew bundleRelease                       │
│     耗时：3-5 分钟                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┘
│  4. 上传 AAB 到 Google Play Console                      │
│     轨道：internal (内测)                                │
│     状态：draft (需要手动审核)                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. 完成！                                              │
│     显示 Google Play Console 链接                        │
│     前往审核并发布                                      │
└─────────────────────────────────────────────────────────┘
```

## 📋 前置要求

### 1. Google Service Account 密钥

确保密钥文件已放置在项目根目录：

```bash
# 检查密钥文件是否存在
ls -la .play-store-key.json
```

如果不存在，请将密钥文件移动到项目目录：

```bash
mv /path/to/your/treasure-cat-deploy-xxxxx.json .play-store-key.json
```

### 2. Google Play Console 配置

确保服务账号已在 Google Play Console 中授予权限：

1. 访问：https://play.google.com/console
2. 选择你的应用
3. 设置 → API 访问权限
4. 确认服务账号已添加并授予权限：
   - ✅ 应用：查看应用信息
   - ✅ 发布：管理发布和轨道

### 3. 安装依赖

```bash
yarn install
```

## 🎨 输出示例

运行 `yarn deploy:playstore` 后的输出：

```
╔═══════════════════════════════════════════════════════════╗
║   Treasure Cat - Google Play 自动部署工具                ║
╚═══════════════════════════════════════════════════════════╝

📱 从 Google Play 获取最新版本号... (com.treasurecat.app)
✅ 当前最新版本号：5
📈 新版本号将是：6

📝 更新 versionCode: 5 → 6
✅ versionCode 已更新

🔨 开始构建 AAB...
⏳ 这可能需要 3-5 分钟...

[Gradle 构建输出...]

✅ AAB 构建成功！
📦 文件大小：114.23 MB
📍 文件位置：/Users/jenkins3/treasure-hunt/packages/mobile/android/app/build/outputs/bundle/release/app-release.aab

📤 正在上传到 Google Play Console...
✅ 编辑会话已创建：xxx
📦 正在上传 114.23 MB...
✅ AAB 上传成功！版本号：6

🎯 更新 internal 发布轨道...
✅ internal 轨道已更新

💾 提交更改到 Google Play...
✅ 提交成功！

🎉 完成！请前往 Google Play Console 审核发布：
https://play.google.com/console/apps/com.treasurecat.app/releases/internal

⏱️  总耗时：4.52 分钟

✅ 所有步骤完成！
```

## 🔧 自定义配置

### 修改发布轨道

编辑 `scripts/auto-deploy-playstore.js`：

```javascript
const TRACK = 'internal'; // 可选：internal, alpha, beta
```

### 修改包名

通过环境变量覆盖：

```bash
GOOGLE_PLAY_PACKAGE_NAME=com.your.package.name yarn deploy:playstore
```

## 📊 版本管理策略

### Version Code (versionCode)
- **自动管理**：每次部署自动 +1
- **位置**：`android/app/build.gradle`
- **格式**：整数 (1, 2, 3, ...)

### Version Name (versionName)
- **手动管理**：在 `android/app/build.gradle` 中手动更新
- **建议格式**：语义化版本 (1.0.0, 1.0.1, 1.1.0, ...)
- **更新时机**：
  - 小修复：1.0.0 → 1.0.1
  - 新功能：1.0.0 → 1.1.0
  - 大版本：1.0.0 → 2.0.0

## 🛡️ 安全注意事项

- ⚠️ **不要**将 `.play-store-key.json` 提交到 git
- ✅ 密钥文件已添加到 `.gitignore`
- ✅ 文件权限应设置为 600 (只有所有者可读写)
- ✅ 只在本地项目中使用，不上传到任何地方

检查权限：
```bash
chmod 600 .play-store-key.json
```

## 🐛 故障排除

### 问题 1：找不到密钥文件

**错误信息**：
```
Service account key not found
```

**解决方法**：
```bash
# 检查文件是否存在
ls -la .play-store-key.json

# 如果不存在，移动密钥文件到项目目录
mv /path/to/key.json .play-store-key.json
```

### 问题 2：权限错误

**错误信息**：
```
Permission denied
```

**解决方法**：
1. 确认服务账号已在 Google Play Console 中授予权限
2. 等待 5-10 分钟让权限生效
3. 检查服务账号邮箱是否正确

### 问题 3：应用不存在

**错误信息**：
```
404 Not Found
```

**解决方法**：
1. 确保应用已在 Google Play Console 中创建
2. 确认包名正确：`com.treasurecat.app`

### 问题 4：构建失败

**错误信息**：
```
AAB build failed
```

**解决方法**：
```bash
# 清理并重新构建
cd android
./gradlew clean
./gradlew bundleRelease
```

### 问题 5：Version Code 冲突

**错误信息**：
```
Version code already exists
```

**解决方法**：
- 脚本会自动处理这个问题
- 确保每次部署都使用脚本，不要手动修改 versionCode

## 📚 相关脚本

| 命令 | 说明 |
|------|------|
| `yarn deploy:playstore` | 一键部署（推荐） |
| `yarn playstore:version` | 仅查看当前版本号 |
| `node scripts/get-latest-version.js` | 同上（备用） |
| `node scripts/auto-deploy-playstore.js` | 同上（备用） |

## 🎯 最佳实践

### 1. 部署前检查清单

- [ ] 代码已测试通过
- [ ] 所有文件已提交到 git
- [ ] 密钥文件存在且权限正确
- [ ] 网络连接稳定

### 2. 部署频率

- **开发阶段**：每天 1-2 次（内测轨道）
- **测试阶段**：每周 2-3 次（alpha/beta 轨道）
- **生产阶段**：按需发布（production 轨道）

### 3. 版本记录

建议在 git 中创建标签：

```bash
# 部署成功后创建标签
git tag v1.0.0
git push origin v1.0.0
```

### 4. 发布说明

在 Google Play Console 中填写发布说明：
- 新增功能
- Bug 修复
- 性能改进

## 📞 获取帮助

如果遇到问题：

1. 查看错误日志
2. 检查本文档的故障排除部分
3. 确认所有前置要求已满足
4. 尝试重新运行脚本

## 🔗 相关链接

- [Google Play Console](https://play.google.com/console)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Play API 文档](https://developers.google.com/android-publisher)

---

**祝你部署顺利！🎉**
