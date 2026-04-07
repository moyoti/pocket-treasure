import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ItemRarity } from '../../item/entities/item.entity';

@Entity('market_transactions')
export class MarketTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  listingId: string;

  @Column()
  @Index()
  sellerId: string;

  @Column()
  @Index()
  buyerId: string;

  @Column()
  @Index()
  itemId: string;

  @Column()
  itemName: string;

  @Column({
    type: 'text',
    default: ItemRarity.COMMON,
  })
  itemRarity: ItemRarity;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'integer' })
  @Index()
  unitPrice: number;

  @Column({ type: 'integer' })
  @Index()
  totalPrice: number;

  @Column({ type: 'integer' })
  fee: number;

  @Column({ type: 'integer' })
  sellerReceives: number;

  @Column({ type: 'integer' })
  feeAccumulated: number;

  @CreateDateColumn()
  @Index()
  soldAt: Date;
}
