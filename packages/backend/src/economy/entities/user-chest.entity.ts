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
import { ChestDefinition, ChestType } from './chest-definition.entity';

@Entity('user_chests')
@Index(['userId', 'chestId'])
export class UserChest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => ChestDefinition)
  @JoinColumn()
  chest: ChestDefinition;

  @Column()
  chestId: string;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn()
  acquiredAt: Date;
}