# Google Play Store 自动发布脚本

## 功能特性

- ✅ 自动从 Google Play Console 获取最新版本号
- ✅ 自动递增 version code
- ✅ 自动构建 AAB 文件
- ✅ 自动上传到内测轨道

## 前置准备

### 1. 创建 Google Service Account

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google Play Android Developer API**
4. 创建服务账号：
   - IAM & Admin → Service Accounts → Create Service Account
   - 服务账号名称：`play-store-deploy`
   - 角色：不需要选择
5. 创建密钥：
   - 点击创建的服务账号 → Keys → Add Key → Create new key
   - 选择 JSON 格式
   - 下载后保存为 `play-store-key.json`

### 2. 关联 Google Play Console

1. 访问 [Google Play Console](https://play.google.com/console)
2. 设置 → API 访问权限
3. 创建新用户或链接现有服务账号
4. 邀请服务账号邮箱（在服务账号详情中查看）
5. 授予权限：
   - **应用**：查看应用信息和下载批量报告
   - **发布**：管理发布和轨道

### 3. 安装依赖

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile
yarn add googleapis --dev
```

### 4. 配置环境变量

创建 `.env` 文件或设置环境变量：

```bash
# .env
GOOGLE_SERVICE_ACCOUNT_KEY=/absolute/path/to/play-store-key.json
GOOGLE_PLAY_PACKAGE_NAME=com.treasurecat.app
```

## 使用方法

### 完整流程（获取版本号 + 构建 + 上传）

```bash
node scripts/publish-to-play-store.js
```

### 仅获取最新版本号

```bash
node scripts/get-latest-version.js
```

## 工作流程

1. **获取最新版本号**
   - 连接到 Google Play API
   - 读取内测轨道的最新 version code
   - 如果没有找到，从 1 开始

2. **递增版本号**
   - 新版本号 = 最新版本号 + 1
   - 更新 `android/app/build.gradle` 中的 `versionCode`

3. **构建 AAB**
   - 执行 `./gradlew bundleRelease`
   - 生成签名后的 AAB 文件

4. **上传到 Google Play**
   - 上传 AAB 到 Google Play Console
   - 创建新的内测发布
   - 状态设置为 `draft`（需要手动审核发布）

## 轨道说明

- `internal` - 内测轨道（推荐用于开发测试）
- `alpha` - 封闭测试
- `beta` - 公开测试
- `production` - 正式发布

修改 `scripts/publish-to-play-store.js` 中的 `TRACK` 变量来切换轨道。

## 注意事项

⚠️ **重要**：
- 首次发布需要先手动上传一个 AAB 到 Google Play Console
- 上传后状态为 `draft`，需要手动在 Play Console 中审核发布
- 确保 `build.gradle` 中的 `versionCode` 是整数类型
- 服务账号密钥文件需要妥善保管，不要提交到 git

## 故障排除

### 错误：Service account key not found
检查 `GOOGLE_SERVICE_ACCOUNT_KEY` 环境变量路径是否正确

### 错误：Permission denied
确认服务账号已在 Google Play Console 中授予足够权限

### 错误：Version code already exists
确保每次构建都使用递增的 version code

### 错误：404 Not Found
如果是首次发布，需要先手动上传一个 AAB 创建轨道

## 自动化集成

### GitHub Actions 示例

```yaml
name: Deploy to Play Store

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Deploy to Play Store
        env:
          GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.PLAY_STORE_KEY }}
          GOOGLE_PLAY_PACKAGE_NAME: com.treasurecat.app
        run: node scripts/publish-to-play-store.js
```

## 相关文件

- `scripts/publish-to-play-store.js` - 主脚本
- `scripts/get-latest-version.js` - 获取版本号工具
- `android/app/build.gradle` - 包含 versionCode 配置
