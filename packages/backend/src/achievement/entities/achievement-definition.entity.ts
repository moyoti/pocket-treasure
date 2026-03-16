import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AchievementType {
  COLLECTION = 'collection',
  RARITY = 'rarity',
  DISTANCE = 'distance',
  STREAK = 'streak',
  SPECIAL = 'special',
}

export interface AchievementRewards {
  coins: number;
  experience: number;
  itemId?: string;
  itemQuantity?: number;
  title?: string;
}

@Entity('achievement_definitions')
export class AchievementDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column({
    type: 'text',
    enum: AchievementType,
  })
  type: AchievementType;

  @Column()
  requirement: number;

  // 奖励字段
  @Column({ type: 'simple-json', nullable: true })
  rewards: AchievementRewards;

  @Column({ nullable: true })
  rarityRequirement: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ default: 1 })
  tier: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}