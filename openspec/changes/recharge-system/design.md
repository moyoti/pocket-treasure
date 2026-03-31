## Context

现有经济体系仅包含 Coins（免费货币），玩家通过游戏玩法获取。缺少付费渠道，无法实现商业变现。目标是在保持游戏公平性的前提下，引入付费选项。

**现有系统：**
- Coins 货币系统（CoinService）
- 商店系统（ShopService）出售宝箱
- 扭蛋系统（GachaService）
- 用户实体（coins, totalCoinsEarned, totalCoinsSpent）

**设计约束：**
- 不能破坏现有游戏平衡
- 免费玩家必须能够持续游戏
- 付费内容仅限加速/装饰，不提供数值优势

## Goals / Non-Goals

**Goals:**
1. 实现双货币体系（Gems + Coins）
2. 接入微信支付/支付宝（预留接口）
3. 提供 6 档充值套餐
4. 实现 Gems 专属扭蛋池
5. 提供充值前端页面

**Non-Goals:**
1. 实际支付 SDK 集成（非功能性占位）
2. Battle Pass 系统（后续迭代）
3. 交易市场（后续迭代）
4. 苹果内购（后续迭代）

## Decisions

### Decision 1: 双货币体系设计

**选择：** Gems（付费）+ Coins（免费）并行

**理由：**
- 保持 Coins 作为主要免费货币，不影响现有游戏经济
- Gems 作为稀缺付费货币，创造价值差异
- 与主流手游货币设计一致

**替代方案：**
- 单一货币（ Coins ）：无法区分付费价值
- 纯氪金直接购买：破坏游戏经济循环

### Decision 2: 充值套餐定价

| 套餐 | 价格 | Gems | 单价 |
|------|------|------|------|
| 小宝石袋 | ¥6 | 60 | ¥0.10 |
| 中宝石袋 | ¥30 | 320 | ¥0.09 |
| 大宝石袋 | ¥68 | 700 | ¥0.09 |
| 宝石箱 | ¥128 | 1380 | ¥0.08 |
| 宝石库 | ¥328 | 3600 | ¥0.08 |
| 宝石王 | ¥648 | 8000 | ¥0.07 |

**理由：** 参考国内手游定价，¥6-648 覆盖各付费层级

### Decision 3: Gems 专属扭蛋池

**设计：** 传说概率 15%（标准池 5%）

**理由：**
- 高概率创造付费动力
- 保底机制保持公平
- 限定皮肤增加稀缺性

### Decision 4: 后端模块结构

```
src/economy/
├── entities/
│   ├── recharge-package.entity.ts   # 充值套餐
│   ├── recharge-record.entity.ts   # 充值记录
│   └── gem-transaction.entity.ts  # Gems 流水
├── services/
│   ├── recharge.service.ts        # 充值处理
│   └── gem.service.ts             # Gems 管理
└── dto/
    └── recharge-callback.dto.ts   # 支付回调
```

**理由：** 与现有 CoinService 结构对齐，易于维护

### Decision 5: 前端页面路由

```
pages/recharge/recharge     # 充值页面
pages/gacha/gacha          # 扩展支持 Gems 池
```

**理由：** 复用现有页面结构，减少开发成本

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 玩家刷金币破坏经济 | 每日获取上限，交易征税 |
| 退款处理复杂 | 订单状态机，支持退款回滚 |
| 首充优惠被滥用 | 用户维度首充标记 |
| Gems 通胀 | Gems 仅消耗不产出（成就奖励少量例外） |

## Migration Plan

1. **Phase 1（后端基础）**
   - 添加 User.gems 字段迁移
   - 创建 GemService
   - 创建 RechargePackage seeder

2. **Phase 2（后端功能）**
   - 实现充值回调接口（预留微信/支付宝）
   - 实现 Gems 消耗（购买、扭蛋）

3. **Phase 3（前端）**
   - 开发充值页面
   - 扩展扭蛋页面支持 Gems

4. **回滚策略**
   - 数据库迁移可逆
   - 旧版客户端兼容新 API

## Open Questions

1. 支付 SDK 选择（微信/支付宝/混合？）
2. 苹果内购分成处理（30%平台税）
3. 首充优惠是否需要运营配置
4. Gems 与 Coins 兑换比例是否公开
