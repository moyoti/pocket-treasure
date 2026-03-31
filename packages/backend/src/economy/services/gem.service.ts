import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { GemTransaction } from '../entities/gem-transaction.entity';
import { GemTransactionType, GemTransactionSource } from '../../../../shared/src/types';

export interface GemTransactionResult {
  success: boolean;
  previousBalance: number;
  newBalance: number;
  amount: number;
}

@Injectable()
export class GemService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GemTransaction)
    private gemTransactionRepository: Repository<GemTransaction>,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.gems ?? 0;
  }

  async getGemStats(userId: string): Promise<{ balance: number; totalEarned: number; totalSpent: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      balance: user.gems ?? 0,
      totalEarned: user.totalGemsEarned ?? 0,
      totalSpent: user.totalGemsSpent ?? 0,
    };
  }

  async addGems(
    userId: string,
    amount: number,
    source: GemTransactionSource,
    description?: string,
    referenceId?: string,
    metadata?: Record<string, any>,
  ): Promise<GemTransactionResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const previousBalance = user.gems ?? 0;
      user.gems = previousBalance + amount;
      user.totalGemsEarned = (user.totalGemsEarned ?? 0) + amount;

      const transaction = manager.create(GemTransaction, {
        userId,
        type: GemTransactionType.EARN,
        source,
        amount,
        description,
        referenceId,
        metadata,
      });

      await manager.save(user);
      await manager.save(transaction);

      return {
        success: true,
        previousBalance,
        newBalance: user.gems,
        amount,
      };
    });
  }

  async deductGems(
    userId: string,
    amount: number,
    source: GemTransactionSource,
    description?: string,
    referenceId?: string,
    metadata?: Record<string, any>,
  ): Promise<GemTransactionResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const previousBalance = user.gems ?? 0;
      if (previousBalance < amount) {
        throw new BadRequestException('Insufficient gems');
      }

      user.gems = previousBalance - amount;
      user.totalGemsSpent = (user.totalGemsSpent ?? 0) + amount;

      const transaction = manager.create(GemTransaction, {
        userId,
        type: GemTransactionType.SPEND,
        source,
        amount: -amount,
        description,
        referenceId,
        metadata,
      });

      await manager.save(user);
      await manager.save(transaction);

      return {
        success: true,
        previousBalance,
        newBalance: user.gems,
        amount,
      };
    });
  }

  async hasEnoughGems(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  async getTransactionHistory(
    userId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ transactions: GemTransaction[]; total: number }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.gemTransactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { transactions, total };
  }
}