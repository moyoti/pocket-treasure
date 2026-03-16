import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ItemRarity } from '../../item/entities/item.entity';

export type PoiType =
  | 'landmark'
  | 'park'
  | 'museum'
  | 'temple'
  | 'shopping'
  | 'entertainment'
  | 'business'
  | 'other';

export interface PoiBonusRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

@Entity('pois')
@Index(['latitude', 'longitude'])
export class POI {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  osmId: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', default: 'other' })
  poiType: PoiType;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  spawnWeight: number;

  @Column({ default: 0 })
  collectCount: number;

  @Column({ type: 'simple-json', nullable: true })
  bonusRates: PoiBonusRates;

  @CreateDateColumn()
  createdAt: Date;
}