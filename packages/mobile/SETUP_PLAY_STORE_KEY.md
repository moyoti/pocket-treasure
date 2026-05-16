# 设置 Google Play 密钥文件

## 📦 已配置：项目局部密钥

脚本现在会自动在项目目录中查找密钥文件，**不会影响其他项目**。

## 🔑 步骤 1：放置密钥文件

将你的密钥文件移动到项目根目录：

```bash
# 选项 A：隐藏文件（推荐）
mv /Users/jenkins3/Downloads/treasure-cat-deploy-59a6d8edf551.json \
   /Users/jenkins3/treasure-hunt/packages/mobile/.play-store-key.json

# 选项 B：普通文件名
mv /Users/jenkins3/Downloads/treasure-cat-deploy-59a6d8edf551.json \
   /Users/jenkins3/treasure-hunt/packages/mobile/play-store-key.json
```

## 🔒 步骤 2：设置文件权限

```bash
chmod 600 /Users/jenkins3/treasure-hunt/packages/mobile/.play-store-key.json
```

## ✅ 步骤 3：验证

```bash
# 检查文件是否存在
ls -la /Users/jenkins3/treasure-hunt/packages/mobile/.play-store-key.json

# 测试连接
cd /Users/jenkins3/treasure-hunt/packages/mobile
node scripts/get-latest-version.js
```

预期输出：
```
📱 Fetching version code for com.treasurecat.app (internal track)...
✅ Latest version code: 0
📈 Next version code should be: 1
```

## 📝 工作原理

脚本会按顺序查找以下位置的密钥文件：

1. `./.play-store-key.json` - 项目根目录的隐藏文件
2. `./play-store-key.json` - 项目根目录的普通文件
3. `../.play-store-key.json` - 上一级目录
4. `GOOGLE_SERVICE_ACCOUNT_KEY` 环境变量（如果设置）

**找到第一个存在的文件就会使用它。**

## 🛡️ 安全性

- ✅ 密钥文件已添加到 `.gitignore`，不会被提交
- ✅ 文件权限设置为 600（只有你能读取）
- ✅ 只在当前项目中使用，不影响其他项目
- ✅ 不需要设置全局环境变量

## 🎯 使用方法

设置完成后，直接使用：

```bash
# 查看最新版本号
node scripts/get-latest-version.js

# 自动构建并上传
node scripts/publish-to-play-store.js
```

不需要任何额外的环境变量设置！

## 📚 文件位置总结

```
treasure-hunt/
└── packages/
    └── mobile/
        ├── .play-store-key.json      ← 密钥文件（已添加到 .gitignore）
        ├── scripts/
        │   ├── get-latest-version.js
        │   └── publish-to-play-store.js
        └── PLAY_STORE_AUTO_DEPLOY.md
```

## ❓ 常见问题

**Q: 可以放在其他位置吗？**
A: 可以，设置环境变量：
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/key.json
```

**Q: 如何在多个项目中使用？**
A: 每个项目放置一份密钥副本，互不影响。

**Q: 密钥文件泄露了怎么办？**
A: 立即在 Google Cloud Console 中删除该密钥，重新创建新的。
