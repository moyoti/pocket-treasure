## Why

当前应用缺少付费充值功能，无法实现商业变现。玩家只能通过游戏内努力获取金币，缺乏付费选项限制了收入来源。通过实现双货币体系和充值系统，可以让玩家选择付费加速游戏进度，同时保持免费玩家的良好体验。

## What Changes

1. **新增 Gems (宝石) 货币**
   - 作为付费专属货币，与免费金币系统并行
   - 可通过充值获得，也可通过成就/任务少量获取

2. **新增充值系统**
   - 后端：充值套餐、订单记录、支付回调处理
   - 前端：充值页面展示套餐选择

3. **新增付费专属内容**
   - Gems 专属扭蛋池（更高传说概率）
   - 限定皮肤/头像框（纯装饰）
   - 幸运药水（增加稀有物品出现概率）

4. **扩展现有系统**
   - User 实体新增 gems 字段
   - CoinService 类似实现 GemService
   - 交易记录新增 Gems 类型

## Capabilities

### New Capabilities
- `recharge-packages`: 充值套餐管理（后端）
- `recharge-orders`: 充值订单与回调处理（后端）
- `recharge-page`: 充值前端页面（小程序）
- `gems-currency`: Gems 货币系统（后端+前端）
- `gems-shop`: Gems 专属商店内容（后端+前端）
- `premium-gacha`: Gems 专属扭蛋池（后端+前端）

### Modified Capabilities
- （无 - 新功能不影响现有需求变更）

## Impact

**后端影响：**
- `packages/backend/src/economy/` - 新增 recharge 模块
- `packages/backend/src/user/entities/user.entity.ts` - 扩展 gems 字段
- `packages/backend/src/economy/services/` - 新增 GemService

**前端影响：**
- `packages/miniprogram/src/pages/recharge/` - 新充值页面
- `packages/miniprogram/src/pages/gacha/` - 新增 Gems 扭蛋池
- `packages/miniprogram/src/pages/shop/` - 新增 Gems 专属标签

**数据库迁移：**
- User 表新增 gems, totalGemsPurchased 字段
- 新增 recharge_packages, recharge_records 表
