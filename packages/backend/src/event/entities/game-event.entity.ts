import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type EventBonusType = 'rarity' | 'quantity' | 'coins' | 'legendary_rate';

@Entity('game_events')
export class GameEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  nameZh: string;  // Chinese name

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'text',
    default: 'rarity',
  })
  bonusType: EventBonusType;

  // Bonus value (percentage or multiplier depending on bonusType)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  bonusValue: number;

  // Special items that only appear during this event
  @Column({ type: 'simple-json', nullable: true })
  specialItems: string[];

  // Restrict to specific POIs (optional, null = all POIs)
  @Column({ type: 'simple-json', nullable: true })
  restrictedPoiTypes: string[];

  // Image URL for event banner
  @Column({ nullable: true })
  bannerUrl: string;

  // Icon for event
  @Column({ nullable: true })
  iconUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}