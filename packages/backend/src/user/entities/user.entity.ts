import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  appleId: string;

  @Column({ nullable: true, unique: true })
  @Index()
  wechatOpenId: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 'user' })
  role: string; // 'user' or 'admin'

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @Column({ nullable: true })
  socketId: string;

  // 游戏属性
  @Column({ default: 0 })
  coins: number;

  @Column({ default: 0 })
  totalCoinsEarned: number;

  @Column({ default: 0 })
  totalCoinsSpent: number;

  @Column({ default: 0 })
  experience: number;

  @Column({ default: 1 })
  level: number;

  @Column({ type: 'datetime', nullable: true })
  lastLoginDate: Date;

  @Column({ default: 0 })
  loginStreak: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  luckyPoints: number;

  // User preferences (settings)
  @Column({ type: 'simple-json', nullable: true })
  preferences: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    achievementNotifications?: boolean;
    rareItemAlerts?: boolean;
    showAllItems?: boolean;
    showRarityFilter?: boolean;
    autoCollectNearby?: boolean;
    defaultZoom?: number;
    publicProfile?: boolean;
    showOnLeaderboard?: boolean;
    shareLocation?: boolean;
    darkMode?: boolean;
    highContrast?: boolean;
    reducedMotion?: boolean;
    language?: string;
  };

  @OneToMany(() => InventoryItem, (inventoryItem) => inventoryItem.user)
  inventoryItems: InventoryItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}