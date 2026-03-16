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

export enum CoinTransactionType {
  EARN = 'earn',
  SPEND = 'spend',
}

export enum CoinTransactionSource {
  ITEM_SALE = 'item_sale',
  DAILY_TASK = 'daily_task',
  ACHIEVEMENT = 'achievement',
  SHOP_PURCHASE = 'shop_purchase',
  CHEST_OPEN = 'chest_open',
  GACHA = 'gacha',
  ADMIN = 'admin',
  LOGIN_BONUS = 'login_bonus',
}

@Entity('coin_transactions')
@Index(['userId', 'createdAt'])
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'text',
  })
  type: CoinTransactionType;

  @Column({
    type: 'text',
  })
  source: CoinTransactionSource;

  @Column()
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  referenceId: string; // Reference to related entity (shop item, achievement, etc.)

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}