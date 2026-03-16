# 寻宝记微信小程序

微信小程序版本的寻宝记游戏。

## 开发说明

### 环境准备

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 在微信开发者工具中导入此目录
3. 修改 `src/app.ts` 中的 `apiBaseUrl` 为你的后端API地址

### 配置

1. 在微信公众平台注册小程序并获取 AppID
2. 修改 `project.config.json` 中的 `appid` 字段

### 功能模块

- **登录/注册** - 邮箱登录，支持微信一键登录（需配置）
- **地图探索** - 使用腾讯地图显示附近宝藏，支持收集
- **背包系统** - 查看收集的物品，出售给NPC
- **商店** - 购买游戏道具
- **抽奖** - 抽奖池系统，支持保底机制
- **市场** - 玩家间交易
- **成就** - 成就系统
- **排行榜** - 玩家排名

### 地图配置

小程序使用腾讯地图，需要在 `app.json` 中配置：

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "获取您的位置信息，用于显示附近的宝藏"
    }
  }
}
```

### 图标资源

需要在 `src/assets/icons/` 目录下准备以下图标文件：

- map.png / map-active.png
- inventory.png / inventory-active.png
- shop.png / shop-active.png
- profile.png / profile-active.png
- coin.png
- location.png
- refresh.png
- treasure.png

### 发布流程

1. 在微信开发者工具中点击「上传」
2. 在微信公众平台提交审核
3. 审核通过后发布

## 目录结构

```
packages/miniprogram/
├── src/
│   ├── app.ts          # 应用入口
│   ├── app.json        # 应用配置
│   ├── app.wxss        # 全局样式
│   ├── pages/          # 页面
│   │   ├── login/      # 登录页
│   │   ├── map/        # 地图页
│   │   ├── inventory/  # 背包页
│   │   ├── shop/       # 商店页
│   │   ├── profile/    # 个人中心
│   │   ├── achievements/ # 成就页
│   │   ├── leaderboard/  # 排行榜
│   │   ├── gacha/      # 抽奖页
│   │   └── market/     # 市场页
│   ├── utils/          # 工具函数
│   │   └── api.ts      # API封装
│   ├── assets/         # 静态资源
│   └── sitemap.json    # 索引配置
├── package.json
├── tsconfig.json
└── project.config.json
```