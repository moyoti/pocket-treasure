# Google Play 上架材料清单

## 应用信息

### 基本信息
- **应用名称**: 寻宝记
- **简短描述**: 探索真实世界，收集虚拟宝藏，成为收藏大师！
- **应用类别**: 游戏 > 冒险
- **内容分级**: 所有人（允许所有用户下载）

### 应用图标
文件: `icon/App-Icon-1024x1024.png`
尺寸: 512x512 像素
要求: PNG格式，支持透明背景

**Android自适应图标备选**:
- `icon/adaptive-icon.png` (前景层)

### 功能图形 (Feature Graphic)
文件: `feature-graphic/feature_graphic.png`
尺寸: 1024x500 像素
要求: PNG/JPG格式，文件<2MB

**设计建议**:
- 展示游戏核心玩法或视觉效果
- 避免文字（会被裁剪）
- 中心内容保持清晰

### 手机截图
需要 2-8 张截图，建议 4-6 张

| 尺寸要求 | 宽高比 |
|---------|--------|
| 16:9 | 1920x1080, 1280x720 |
| 9:16 (竖屏) | 1080x1920, 720x1280 |

**建议截图内容**:
1. 地图页面 - 展示附近宝藏
2. 收藏页面 - 展示收集的物品
3. 排行榜页面 - 展示竞争元素
4. 抽卡页面 - 展示游戏奖励

### 平板截图 (可选但建议)
尺寸: 2048x1536 或 1920x1080

---

## 应用描述

### 简短描述 (80字符以内)
探索真实世界，收集虚拟宝藏，成为收藏大师！

### 完整描述
见: `app_description.md` (中文)
见: `app_description_en.md` (English)

---

## 隐私政策

### 必需
Google Play 要求所有应用提供隐私政策 URL

### 隐私政策文档
文件: `privacy_policy.pdf`
必须包含:
1. 数据收集类型
2. 数据使用目的
3. 数据存储和保护
4. 用户权利说明
5. 联系方式

### 隐私政策生成命令
```bash
# 使用 minimax-pdf skill 生成
# 参考 /Users/jenkins3/.minimax-skills/skills/minimax-pdf
```

---

## 商店列表信息

### 开发者账号
- **开发者名称**: [你的开发者名称]
- **联系邮箱**: [邮箱]
- **网站**: [可选]

### 应用评级
- **目标用户**: 所有年龄
- **内容分级问卷**: 根据实际情况填写

---

## AAB 包要求

### 生成命令
```bash
cd packages/mobile
eas build --platform android --profile preview
# 或
npx expo run:android --variant release
```

### 签名要求
- 使用 Google Play 签名密钥
- 或创建自有签名密钥

---

## 资产文件清单

```
google-play-assets/
├── icon/
│   ├── App-Icon-1024x1024.png     # 主图标 (512x512)
│   └── adaptive-icon.png         # 自适应图标前景
├── screenshots/
│   ├── phone_screenshot_1.png    # 手机截图
│   ├── phone_screenshot_2.png
│   ├── ...
│   └── tablet_screenshot_1.png    # 平板截图 (可选)
├── feature-graphic/
│   └── feature_graphic.png       # 1024x500
├── app_description.md            # 中文描述
├── app_description_en.md         # 英文描述
├── privacy_policy.pdf            # 隐私政策文档
└── README.md                      # 本文件
```

---

## 下一步

1. [ ] 准备截图 (可用模拟器或真机截图)
2. [ ] 如需生成功能图形，使用设计工具创建
3. [ ] 生成隐私政策文档
4. [ ] 在 Google Play Console 创建应用
5. [ ] 上传 AAB 包
6. [ ] 填写所有商店信息
7. [ ] 提交审核

---

## 审核注意事项

### 常见拒绝原因
1. 截图与实际应用不符
2. 隐私政策链接无效
3. 应用图标使用了不恰当的内容
4. 描述中包含误导性信息

### 加速审核建议
- 确保所有截图都是真实应用界面
- 隐私政策必须真实可访问
- 测试账号确保应用可正常运行
