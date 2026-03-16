# 游戏玩法系统架构设计

## 一、数据库实体设计

### 1. 每日任务系统实体

**文件: `packages/backend/src/daily-task/entities/daily-task.entity.ts`**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

// 任务类型枚举
export enum TaskType {
  LOGIN = 'login',           // 每日登录
  COLLECT = 'collect',       // 收集物品
  VISIT_POI = 'visit_poi',   // 访问POI
  COLLECT_RARITY = 'collect_rarity', // 收集指定稀有度物品
}

// 任务状态枚举
export enum TaskStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLAIMED = 'claimed',  // 已领取奖励
}

@Entity('daily_tasks')
@Index(['userId', 'taskDate', 'taskType'])
export class DailyTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({
    type: 'text',
    enum: TaskType,
  })
  taskType: TaskType;

  @Column()
  taskDate: string; // 格式: YYYY-MM-DD，用于每日重置

  @Column({ default: 0 })
  currentProgress: number; // 当前进度

  @Column()
  targetProgress: number; // 目标进度

  @Column({
    type: 'text',
    enum: TaskStatus,
    default: TaskStatus.IN_PROGRESS,
  })
  status: TaskStatus;

  // 奖励配置
  @Column({ type: 'simple-json' })
  rewards: TaskRewards;

  @Column({ nullable: true })
  rarityRequirement: string; // 对于 collect_rarity 类型，指定稀有度

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  claimedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

interface TaskRewards {
  coins: number;       // 金币奖励
  experience: number;  // 经验值奖励
  itemId?: string;     // 物品奖励ID（可选）
  itemQuantity?: number; // 物品奖励数量
}
```

**文件: `packages/backend/src/daily-task/entities/task-template.entity.ts`**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskType } from './daily-task.entity';

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    enum: TaskType,
  })
  taskType: TaskType;

  @Column()
  name: string; // 任务名称

  @Column({ type: 'text' })
  description: string; // 任务描述

  @Column({ type: 'simple-json' })
  rewards: {
    coins: number;
    experience: number;
    itemId?: string;
    itemQuantity?: number;
  };

  @Column()
  targetProgress: number;

  @Column({ nullable: true })
  rarityRequirement: string;

  @Column({ default: 1 })
  weight: number; // 权重，用于随机选择任务

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. 成就奖励系统实体

**文件: `packages/backend/src/achievement/entities/achievement-definition.entity.ts`**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AchievementType {
  COLLECTION = 'collection',
  RARITY = 'rarity',
  DISTANCE = 'distance',
  STREAK = 'streak',
  SPECIAL = 'special',
}

@Entity('achievement_definitions')
export class AchievementDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column({
    type: 'text',
    enum: AchievementType,
  })
  type: AchievementType;

  @Column()
  requirement: number;

  // 奖励字段
  @Column({ type: 'simple-json', nullable: true })
  rewards: AchievementRewards;

  @Column({ nullable: true })
  rarityRequirement: string; // 对于稀有度成就

  @Column({ default: false })
  isHidden: boolean; // 隐藏成就

  @Column({ default: 1 })
  tier: number; // 成就等级（1-5）

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

interface AchievementRewards {
  coins: number;
  experience: number;
  itemId?: string;
  itemQuantity?: number;
  title?: string; // 称号奖励
}
```

### 3. 限定物品系统

**修改文件: `packages/backend/src/item/entities/item.entity.ts`** - 添加字段：

```typescript
// 在现有 Item 实体中添加以下字段

// 新增限定物品字段
@Column({ default: false })
isLimited: boolean; // 是否为限定物品

@Column({ type: 'datetime', nullable: true })
availableFrom: Date; // 开始时间

@Column({ type: 'datetime', nullable: true })
availableUntil: Date; // 结束时间

@Column({ type: 'text', nullable: true })
season: string; // 所属季节/活动 (如: 'spring_2024', 'anniversary')

@Column({ type: 'simple-json', nullable: true })
specialEffects: SpecialEffects; // 特殊效果

@Column({ default: false })
isExclusive: boolean; // 是否独家/特殊外观

interface SpecialEffects {
  glow?: string;       // 发光颜色
  particles?: string;  // 粒子效果
  sound?: string;      // 收集音效
  animation?: string;  // 动画效果
}
```

### 4. 用户扩展字段

**修改文件: `packages/backend/src/user/entities/user.entity.ts`** - 添加字段：

```typescript
// 新增游戏属性
@Column({ default: 0 })
coins: number; // 金币

@Column({ default: 0 })
experience: number; // 经验值

@Column({ default: 1 })
level: number; // 等级

@Column({ type: 'datetime', nullable: true })
lastLoginDate: Date; // 最后登录日期

@Column({ default: 0 })
loginStreak: number; // 连续登录天数
```

---

## 二、API接口设计

### 1. 每日任务 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/daily-tasks` | 获取用户当日任务列表 |
| POST | `/api/daily-tasks/claim/:taskId` | 领取任务奖励 |
| POST | `/api/daily-tasks/refresh` | 刷新任务（使用金币） |

### 2. 成就奖励 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/achievements` | 获取所有成就定义 |
| GET | `/api/achievements/me` | 获取用户成就进度 |
| POST | `/api/achievements/claim/:achievementId` | 领取成就奖励 |

### 3. 限定物品 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/items/limited` | 获取当前限时物品列表 |
| GET | `/api/items/season/:season` | 获取指定季节的限定物品 |

### 4. 用户游戏属性 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/user/stats` | 获取用户游戏统计数据 |

---

## 三、关键业务逻辑

### 1. 每日任务系统

- 每日0点自动重置任务
- 登录时生成/更新任务
- 收集物品时更新进度
- 访问POI时更新进度

### 2. 成就奖励系统

- 事件驱动进度更新
- 物品收集触发收集类成就
- 稀有物品获得触发稀有度成就
- 奖励领取后更新用户金币/经验

### 3. 限定物品系统

- 基于时间范围的生成控制
- 可配置位置限制
- 集成到SpawnService的生成逻辑

---

## 四、实施阶段

1. **阶段一**: 数据库基础设施（实体、迁移脚本）
2. **阶段二**: 每日任务系统实现
3. **阶段三**: 成就奖励系统扩展
4. **阶段四**: 限定物品系统集成