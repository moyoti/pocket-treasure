import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Trade } from './trade.entity';

export enum TradeItemOwner {
  INITIATOR = 'initiator',
  RECEIVER = 'receiver',
}

@Entity('trade_items')
@Index(['tradeId', 'owner'])
export class TradeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tradeId: string;

  @ManyToOne(() => Trade, (trade) => trade.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column()
  inventoryItemId: string;

  @Column()
  itemId: string;

  @Column()
  itemName: string;

  @Column({ type: 'text' })
  owner: TradeItemOwner;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;
}