# Treasure Cat - 跨设备备份与恢复指南

## 📱 备份功能说明

Treasure Cat 支持完整的游戏数据备份，包括：
- ✅ 用户身份（助记词）
- ✅ 背包物品
- ✅ 收集历史
- ✅ 扭蛋记录
- ✅ 商店购买
- ✅ 成就进度
- ✅ 任务进度
- ✅ 探索区域
- ✅ 交易历史
- ✅ 所有其他游戏数据

## 🔄 在 iOS 设备之间转移

### 方法 1：AirDrop（推荐）

**在旧设备上：**
1. 打开 Treasure Cat → 进入"我的"页面
2. 点击 **"Backup All Data"**
3. 点击 **"Create Backup"** 创建备份
4. 在备份列表中，找到刚创建的备份文件
5. 点击 **分享图标 (📤)**
6. 选择 **AirDrop** → 选择你的新 iOS 设备

**在新设备上：**
1. 接收 AirDrop 文件
2. 系统会询问"用 Treasure Cat 打开？"
3. 点击 **"拷贝到 Treasure Cat"**
4. 备份会自动导入并显示在列表中
5. 点击备份 → 选择 **"Restore"** → 确认
6. **重启应用**完成恢复

### 方法 2：iCloud Drive

**在旧设备上：**
1. 创建备份后，点击分享图标
2. 选择 **"存储到文件"**
3. 选择 **iCloud Drive** → 保存

**在新设备上：**
1. 打开 **文件 (Files)** App
2. 进入 **iCloud Drive**
3. 找到备份文件（`treasurecat_backup_*.json`）
4. 长按文件 → 选择 **"共享"**
5. 选择 **"拷贝到 Treasure Cat"**
6. 在 Treasure Cat 中恢复备份

### 方法 3：消息/邮件

**在旧设备上：**
1. 创建备份 → 点击分享图标
2. 选择 **信息** 或 **邮件**
3. 发送给自己

**在新设备上：**
1. 打开信息或邮件
2. 点击附件（备份文件）
3. 选择 **"用 Treasure Cat 打开"**

---

## 🤖 在 Android 设备之间转移

### 方法 1：直接文件复制（推荐）

**在旧设备上：**
1. 使用文件管理器找到备份文件：
   ```
   /Android/data/com.treasurecat.app/files/backups/
   ```
2. 复制 `treasurecat_backup_*.json` 文件
3. 通过蓝牙、微信、QQ 等发送到新设备

**在新设备上：**
1. 接收文件并保存
2. 使用文件管理器将文件复制到：
   ```
   /Android/data/com.treasurecat.app/files/backups/
   ```
3. 重启 Treasure Cat 应用
4. 进入"我的" → "Backup All Data"
5. 备份会出现在列表中 → 点击恢复

### 方法 2：Google Drive

**在旧设备上：**
1. 创建备份 → 点击分享图标
2. 选择 **Google Drive**
3. 上传到云端

**在新设备上：**
1. 打开 Google Drive App
2. 下载备份文件
3. 按照"方法 1"复制到备份目录

---

## 🍎 ↔️ 🤖 iOS 和 Android 互转

### iOS → Android

1. **在 iOS 设备上：**
   - 创建备份
   - 通过邮件/消息发送 JSON 文件到 Android 设备
   - 或使用 iCloud Drive → 在 Android 上下载

2. **在 Android 设备上：**
   - 接收 JSON 文件
   - 复制到：`/Android/data/com.treasurecat.app/files/backups/`
   - 重启应用 → 恢复备份

### Android → iOS

1. **在 Android 设备上：**
   - 创建备份
   - 通过邮件/消息发送 JSON 文件到 iOS 设备
   - 或使用 Google Drive → 在 iOS 上下载

2. **在 iOS 设备上：**
   - 接收 JSON 文件
   - 打开文件 → 选择 **"用 Treasure Cat 打开"**
   - 或保存到 Files App → 拷贝到 Treasure Cat
   - 恢复备份

---

## 📂 备份文件位置

### iOS
```
App 沙盒/Documents/backups/
或
App 沙盒/Library/Application Support/backups/
```

通过 **文件 (Files)** App 访问：
- 打开 Files App
- 进入 "On My iPhone" → "Treasure Cat" → "backups"

### Android
```
/Android/data/com.treasurecat.app/files/backups/
```

通过文件管理器访问：
- 打开文件管理器
- 进入 "Android" → "data" → "com.treasurecat.app" → "files" → "backups"

---

## ⚠️ 重要提示

1. **备份文件包含敏感数据**
   - 包含你的助记词（私钥）
   - **不要分享给他人**
   - 妥善保管，建议加密存储

2. **恢复会覆盖所有数据**
   - 恢复操作会**完全替换**当前设备的所有游戏数据
   - 恢复前请确保已备份当前数据（如果需要）

3. **备份版本兼容性**
   - 当前备份版本：`1.0.0`
   - 未来版本可能不兼容旧备份
   - 建议定期创建新备份

4. **重启应用**
   - 手动复制备份文件后，**必须重启应用**才能看到
   - 恢复备份后，系统会提示重启

---

## 🆘 常见问题

### Q: 备份文件无法打开？
A: 确保文件扩展名为 `.json`，且文件名格式为 `treasurecat_backup_*.json`

### Q: 恢复后数据不见了？
A: 恢复操作需要**重启应用**才能生效。请完全关闭应用后重新打开。

### Q: 可以在多个设备上同时使用吗？
A: 可以，但每个设备的数据是独立的。如果想同步数据，需要手动导入/导出备份。

### Q: 备份文件有多大？
A: 通常几 KB 到几十 KB，取决于游戏数据量。

### Q: 可以删除旧备份吗？
A: 可以。在 "Backup All Data" 界面，点击垃圾桶图标删除不需要的备份。

---

## 📞 需要帮助？

如果遇到问题：
1. 检查备份文件是否完整（JSON 格式）
2. 确保文件放在正确的目录
3. 重启应用后重试
4. 联系技术支持

**祝你游戏愉快！** 🎮✨
