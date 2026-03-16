import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SpawnedItem } from '../../spawn/entities/spawned-item.entity';

export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum ItemType {
  COLLECTIBLE = 'collectible',
  CONSUMABLE = 'consumable',
  COSMETIC = 'cosmetic',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'text',
    default: ItemRarity.COMMON,
  })
  rarity: ItemRarity;

  @Column({
    type: 'text',
    default: ItemType.COLLECTIBLE,
  })
  type: ItemType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  spawnWeight: number;

  @Column({ default: 1 })
  maxStack: number;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ nullable: true })
  modelUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  canTrade: boolean; // Whether this item can be traded on the market

  @OneToMany(() => SpawnedItem, (spawnedItem) => spawnedItem.item)
  spawnedItems: SpawnedItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}