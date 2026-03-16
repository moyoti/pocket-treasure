import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ChestType {
  WOODEN = 'wooden',
  IRON = 'iron',
  GOLDEN = 'golden',
  LEGENDARY = 'legendary',
}

export interface ChestDrop {
  rarity: string;
  weight: number;
  minQuantity: number;
  maxQuantity: number;
}

@Entity('chest_definitions')
export class ChestDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'text',
    enum: ChestType,
    unique: true,
  })
  type: ChestType;

  @Column({ default: 0 })
  price: number; // 开启需要的金币数量，0 表示免费

  @Column({ nullable: true })
  iconUrl: string;

  // 掉落表配置
  @Column({ type: 'simple-json' })
  drops: ChestDrop[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}