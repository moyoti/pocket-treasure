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
  VISIT_POI = 'visit_poi',  // 访问POI
  COLLECT_RARITY = 'collect_rarity', // 收集指定稀有度物品
}

// 任务状态枚举
export enum TaskStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLAIMED = 'claimed',  // 已领取奖励
}

// 奖励接口
export interface TaskRewards {
  coins: number;       // 金币奖励
  experience: number;  // 经验值奖励
  itemId?: string;     // 物品奖励ID（可选）
  itemQuantity?: number; // 物品奖励数量
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