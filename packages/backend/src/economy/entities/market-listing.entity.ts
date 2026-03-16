import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Item, ItemRarity } from '../../item/entities/item.entity';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('market_listings')
export class MarketListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  seller: User;

  @Column({ nullable: true })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  buyer: User;

  @Column()
  inventoryItemId: string;

  @Column()
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn()
  item: Item;

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
  price: number; // Price per unit

  @Column({ type: 'integer' })
  totalPrice: number; // Total price (price * quantity)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.1 })
  feeRate: number; // 10% fee

  @Column({ type: 'integer' })
  fee: number; // Fee amount (totalPrice * feeRate)

  @Column({ type: 'integer' })
  sellerReceives: number; // Amount seller receives after fee

  @Column({
    type: 'text',
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'datetime' })
  soldAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}