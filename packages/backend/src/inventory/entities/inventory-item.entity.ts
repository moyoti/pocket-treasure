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
import { Item } from '../../item/entities/item.entity';

@Entity('inventory_items')
@Index(['userId', 'itemId'])
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.inventoryItems)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Item)
  @JoinColumn()
  item: Item;

  @Column()
  itemId: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  collectedLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  collectedLongitude: number;

  @Column({ nullable: true })
  poiName: string;

  @Column({ default: false })
  isLocked: boolean; // Locked when in trade or market listing

  @CreateDateColumn()
  collectedAt: Date;
}