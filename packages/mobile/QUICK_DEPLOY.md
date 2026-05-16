# 🚀 快速部署指南

## 一键部署

```bash
cd /Users/jenkins3/treasure-hunt/packages/mobile
yarn deploy:playstore
```

就这么简单！✨

## 完整流程

脚本会自动完成：

1. ✅ 获取 Google Play 最新版本号
2. ✅ 自动递增 version code (+1)
3. ✅ 构建 Release AAB (3-5 分钟)
4. ✅ 上传到 Google Play 内测轨道
5. ✅ 创建发布（状态：draft）

## 部署后

前往 Google Play Console 审核发布：
- https://play.google.com/console/apps/com.treasurecat.app/releases/internal

## 常用命令

```bash
# 一键部署（最常用）
yarn deploy:playstore

# 查看当前版本号
yarn playstore:version

# 检查密钥文件
ls -la .play-store-key.json
```

## 部署频率

- 开发中：随时部署到内测轨道
- 测试版：每周部署到 alpha/beta
- 正式版：按需部署到 production

## 注意事项

⚠️ 部署前确认：
- 代码已测试
- 密钥文件存在
- 网络稳定

✅ 部署后：
- 在 Play Console 填写发布说明
- 审核并发布

---

详细文档：`DEPLOY_TO_PLAYSTORE.md`
