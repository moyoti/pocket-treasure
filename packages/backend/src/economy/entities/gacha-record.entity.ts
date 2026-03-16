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
import { GachaPool } from './gacha-pool.entity';

@Entity('gacha_records')
@Index(['userId', 'poolId'])
@Index(['userId', 'createdAt'])
export class GachaRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => GachaPool)
  @JoinColumn()
  pool: GachaPool;

  @Column()
  poolId: string;

  // 抽到的物品稀有度
  @Column()
  itemRarity: string;

  // 抽到的物品ID（如果有具体物品）
  @Column({ nullable: true })
  itemId: string;

  // 是否触发保底
  @Column({ default: false })
  isPity: boolean;

  // 当前保底计数
  @Column({ default: 0 })
  pityCount: number;

  // 抽卡类型: single, ten
  @Column({ default: 'single' })
  pullType: string;

  // 花费的金币
  @Column({ default: 0 })
  cost: number;

  @CreateDateColumn()
  createdAt: Date;
}