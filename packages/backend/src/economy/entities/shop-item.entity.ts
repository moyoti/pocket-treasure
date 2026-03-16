import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ShopItemCategory {
  CHEST = 'chest',
  KEY = 'key',
  CONSUMABLE = 'consumable',
  SPECIAL = 'special',
}

export interface ShopItemRewards {
  coins?: number;
  itemId?: string;
  itemQuantity?: number;
  chestType?: string;
  chestQuantity?: number;
  experience?: number;
}

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'text',
    default: ShopItemCategory.CHEST,
  })
  category: ShopItemCategory;

  @Column({ default: 0 })
  price: number;

  @Column({ type: 'simple-json', nullable: true })
  rewards: ShopItemRewards;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'datetime', nullable: true })
  availableFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  availableUntil: Date;

  @Column({ default: 0 })
  purchaseLimit: number; // 0 means unlimited

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}