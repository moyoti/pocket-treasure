import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

type RechargeStatus = 'pending' | 'completed' | 'failed' | 'refunded';

@Entity('recharge_records')
@Index(['userId', 'createdAt'])
export class RechargeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  packageId: string;

  @ManyToOne('RechargePackage', 'records')
  @JoinColumn({ name: 'packageId' })
  rechargePackage: any;

  @Column({ unique: true })
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  gemsAwarded: number;

  @Column({ type: 'text', default: 'pending' })
  status: RechargeStatus;

  @Column({ nullable: true })
  paymentChannel: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}