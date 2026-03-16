import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TradeItem } from './trade-item.entity';

export enum TradeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  initiatorId: string;

  @Column()
  @Index()
  receiverId: string;

  @Column({ type: 'text', default: TradeStatus.PENDING })
  status: TradeStatus;

  @Column({ nullable: true, type: 'text' })
  message: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'datetime' })
  completedAt: Date;

  @OneToMany(() => TradeItem, (tradeItem) => tradeItem.trade, { cascade: true })
  items: TradeItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}