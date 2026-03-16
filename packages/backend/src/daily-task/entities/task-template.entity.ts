import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskType } from './daily-task.entity';

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
  })
  taskType: TaskType;

  @Column()
  name: string; // 任务名称

  @Column({ type: 'text' })
  description: string; // 任务描述

  @Column({ type: 'simple-json' })
  rewards: {
    coins: number;
    experience: number;
    itemId?: string;
    itemQuantity?: number;
  };

  @Column()
  targetProgress: number;

  @Column({ nullable: true })
  rarityRequirement: string;

  @Column({ default: 1 })
  weight: number; // 权重，用于随机选择任务

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}