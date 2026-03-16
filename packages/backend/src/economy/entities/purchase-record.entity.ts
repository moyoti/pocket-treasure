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
import { ShopItem } from './shop-item.entity';

@Entity('purchase_records')
@Index(['userId', 'shopItemId'])
export class PurchaseRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => ShopItem)
  @JoinColumn()
  shopItem: ShopItem;

  @Column()
  shopItemId: string;

  @Column()
  quantity: number;

  @Column()
  totalCost: number;

  @Column({ type: 'simple-json', nullable: true })
  rewardsReceived: Record<string, any>;

  @CreateDateColumn()
  purchasedAt: Date;
}