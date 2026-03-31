import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RechargePackage } from '../entities/recharge-package.entity';
import { RechargeRecord } from '../entities/recharge-record.entity';
import { GemService } from './gem.service';
import { GemTransactionSource } from '../../../../shared/src/types';
import { User } from '../../user/entities/user.entity';

type RechargeStatus = 'pending' | 'completed' | 'failed' | 'refunded';

@Injectable()
export class RechargeService implements OnModuleInit {
  private readonly logger = new Logger(RechargeService.name);

  private readonly DEFAULT_PACKAGES: Partial<RechargePackage>[] = [
    { name: '小宝石袋', price: 6, gemsAmount: 60, bonusGems: 0, isFirstRechargeBonus: true, sortOrder: 1 },
    { name: '中宝石袋', price: 30, gemsAmount: 320, bonusGems: 0, sortOrder: 2 },
    { name: '大宝石袋', price: 68, gemsAmount: 700, bonusGems: 0, sortOrder: 3 },
    { name: '宝石箱', price: 128, gemsAmount: 1380, bonusGems: 0, sortOrder: 4 },
    { name: '宝石库', price: 328, gemsAmount: 3600, bonusGems: 0, sortOrder: 5 },
    { name: '宝石王', price: 648, gemsAmount: 8000, bonusGems: 0, sortOrder: 6 },
  ];

  constructor(
    @InjectRepository(RechargePackage)
    private rechargePackageRepository: Repository<RechargePackage>,
    @InjectRepository(RechargeRecord)
    private rechargeRecordRepository: Repository<RechargeRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private gemService: GemService,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    const count = await this.rechargePackageRepository.count();
    if (count === 0) {
      this.logger.log('Seeding default recharge packages...');
      await this.rechargePackageRepository.save(
        this.DEFAULT_PACKAGES.map((p) => this.rechargePackageRepository.create(p as RechargePackage)),
      );
      this.logger.log('Default recharge packages seeded successfully');
    }
  }

  async getPackages(): Promise<RechargePackage[]> {
    return this.rechargePackageRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getPackage(id: string): Promise<RechargePackage> {
    const pkg = await this.rechargePackageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    return pkg;
  }

  async createOrder(userId: string, packageId: string): Promise<{ orderId: string; amount: number; status: string; isFirstRecharge: boolean }> {
    const pkg = await this.getPackage(packageId);

    // Check if this is the user's first recharge
    const existingRecharges = await this.rechargeRecordRepository.count({
      where: { userId, status: 'completed' as RechargeStatus },
    });
    const isFirstRecharge = existingRecharges === 0;

    // Apply first recharge bonus (double gems)
    const bonusGems = isFirstRecharge ? pkg.gemsAmount : 0;
    const totalGems = pkg.gemsAmount + bonusGems;

    const orderId = `RECHARGE_${uuidv4()}`;

    const record = this.rechargeRecordRepository.create({
      userId,
      packageId: pkg.id,
      orderId,
      amount: pkg.price,
      gemsAwarded: totalGems,
      status: 'pending' as RechargeStatus,
      paymentChannel: 'wechat',
    });

    await this.rechargeRecordRepository.save(record);

    return {
      orderId,
      amount: pkg.price,
      status: 'pending',
      isFirstRecharge,
    };
  }

  async completeOrder(orderNo: string, transactionId: string): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(RechargeRecord, {
        where: { orderId: orderNo },
      });

      if (!record) {
        throw new NotFoundException('Order not found');
      }

      if (record.status !== 'pending') {
        throw new BadRequestException('Order is not pending');
      }

      await this.gemService.addGems(
        record.userId,
        record.gemsAwarded,
        GemTransactionSource.RECHARGE,
        `Recharge order: ${orderNo}`,
        record.id,
      );

      record.status = 'completed';
      record.transactionId = transactionId;
      record.completedAt = new Date();
      await manager.save(record);
    });
  }

  async failOrder(orderNo: string): Promise<void> {
    await this.rechargeRecordRepository.update(
      { orderId: orderNo },
      { status: 'failed' as RechargeStatus },
    );
  }

  async getUserRechargeHistory(userId: string): Promise<RechargeRecord[]> {
    return this.rechargeRecordRepository.find({
      where: { userId, status: 'completed' as RechargeStatus },
      order: { completedAt: 'DESC' },
    });
  }
}