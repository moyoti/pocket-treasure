# Google Play Auto-Deploy - Success! ✅

## 完成时间
2026-05-16

## 实现功能

### 一键部署到 Google Play 内测轨道

只需运行以下命令即可自动完成整个部署流程：

```bash
cd packages/mobile
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export NODE_TLS_REJECT_UNAUTHORIZED=0
yarn deploy:playstore
```

### 自动化流程

1. **获取最新版本号** - 从 Google Play Console 读取当前内测轨道的最新 version code
2. **自动递增版本号** - version code + 1
3. **构建 Signed AAB** - 使用 release keystore 签名构建 Android App Bundle
4. **上传到 Google Play** - 自动上传 AAB 到 Google Play Console
5. **更新内测轨道** - 将新版本添加到 internal testing track
6. **提交发布** - 创建 draft 发布

### 核心文件

#### 脚本文件
- `scripts/auto-deploy-playstore.js` - 主部署脚本（带重试机制）
- `scripts/get-latest-version.js` - 获取版本号工具
- `scripts/test-key.js` - 测试 Google Play API 连接

#### 配置文件
- `android/gradle.properties` - Release 签名配置
- `android/app/build.gradle` - 签名配置和构建配置
- `android/treasurecat-release-key.keystore` - Release 签名密钥库
- `.play-store-key.json` - Google Service Account 密钥

#### 文档
- `PLAY_STORE_AUTO_DEPLOY.md` - 自动部署系统说明
- `DEPLOY_TO_PLAYSTORE.md` - 详细部署文档
- `QUICK_DEPLOY.md` - 快速参考指南

### 签名配置

```properties
# gradle.properties
TREASURECAT_RELEASE_STORE_FILE=treasurecat-release-key.keystore
TREASURECAT_RELEASE_KEY_ALIAS=treasurecat
TREASURECAT_RELEASE_STORE_PASSWORD=treasurecat123
TREASURECAT_RELEASE_KEY_PASSWORD=treasurecat123
```

### 环境变量

```bash
# 代理设置（中国大陆需要）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=http://127.0.0.1:7890

# 忽略 TLS 证书验证（开发环境）
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Package.json 脚本

```json
{
  "scripts": {
    "deploy:playstore": "node scripts/auto-deploy-playstore.js",
    "playstore:version": "node scripts/get-latest-version.js"
  }
}
```

## 测试结果

### ✅ 首次部署成功
- **Version Code**: 1
- **AAB 大小**: 113.25 MB
- **签名**: Release (CN=Treasure Cat)
- **上传时间**: ~3.84 分钟
- **状态**: 已提交到 Google Play Console 待审核

### 验证步骤
1. 访问 [Google Play Console](https://play.google.com/console/apps/com.treasurecat.app/releases/internal)
2. 查看内测轨道
3. 确认版本 1 已上传
4. 点击"开始向内测轨道发布"完成发布

## 后续使用

每次需要发布新版本时，只需运行：

```bash
yarn deploy:playstore
```

脚本会自动：
- 读取当前最新版本号
- 自动递增 version code
- 构建新的 signed AAB
- 上传到 Google Play
- 创建新的 release

## 注意事项

1. **密钥安全**: 
   - `.play-store-key.json` 和 `treasurecat-release-key.keystore` 已添加到 `.gitignore`
   - 不要将这些文件提交到版本控制

2. **代理设置**: 
   - 在中国大陆需要配置代理才能访问 Google API
   - 如果在海外，可以移除 proxy 环境变量

3. **签名密钥**:
   - 妥善保管 keystore 和密码
   - 丢失后将无法更新应用

4. **首次发布**:
   - 首次发布需要在 Google Play Console 手动审核
   - 后续更新会自动进入内测轨道

## 故障排除

### 常见问题

**1. 签名失败**
```
Keystore file not found
```
解决：确保 `treasurecat-release-key.keystore` 文件存在于 `android/` 目录

**2. 上传失败**
```
Error: Unable to connect to Google Play API
```
解决：检查代理设置是否正确，确认网络连接正常

**3. Version code 冲突**
```
Version code already exists
```
解决：手动在 Google Play Console 查看最新版本号，确保本地 version code 正确递增

## 联系支持

如有问题，请查看：
- [Google Play API 文档](https://developers.google.com/android-publisher)
- [Expo 构建文档](https://docs.expo.dev/distribution/building-standalone-apps/)

---

**最后更新**: 2026-05-16
**状态**: ✅ 运行正常
