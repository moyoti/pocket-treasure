import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface GachaPoolItem {
  rarity: string;
  weight: number;
}

@Entity('gacha_pools')
export class GachaPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  // 单抽价格
  @Column({ default: 100 })
  singlePrice: number;

  // 十连价格
  @Column({ default: 900 })
  tenPrice: number;

  // 保底抽数
  @Column({ default: 10 })
  pityThreshold: number;

  // 保底最低稀有度
  @Column({ default: 'rare' })
  pityMinRarity: string;

  // 抽奖池物品权重配置
  @Column({ type: 'simple-json' })
  items: GachaPoolItem[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}