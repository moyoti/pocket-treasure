import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CoinTransaction, CoinTransactionSource, CoinTransactionType } from '../entities/coin-transaction.entity';

// Re-export for convenience
export { CoinTransactionSource, CoinTransactionType };

export interface CoinTransactionResult {
  success: boolean;
  previousBalance: number;
  newBalance: number;
  amount: number;
}

@Injectable()
export class CoinService {
  private readonly logger = new Logger(CoinService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CoinTransaction)
    private transactionRepository: Repository<CoinTransaction>,
  ) {}

  /**
   * 获取用户金币余额
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.coins;
  }

  /**
   * 增加金币 (兼容旧接口)
   */
  async addCoins(
    userId: string,
    amount: number,
    source: CoinTransactionSource,
    description?: string,
    referenceId?: string,
    metadata?: Record<string, any>,
  ): Promise<CoinTransactionResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.userRepository.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const previousBalance = user.coins;
      user.coins += amount;
      user.totalCoinsEarned = (user.totalCoinsEarned || 0) + amount;

      // Create transaction record
      const transaction = manager.create(CoinTransaction, {
        userId,
        type: CoinTransactionType.EARN,
        source,
        amount,
        description,
        referenceId,
        metadata,
      });

      await manager.save(user);
      await manager.save(transaction);

      this.logger.log(`User ${userId} earned ${amount} coins (${source}). New balance: ${user.coins}`);

      return {
        success: true,
        previousBalance,
        newBalance: user.coins,
        amount,
      };
    });
  }

  /**
   * 消耗金币 (别名方法)
   */
  async spendCoins(
    userId: string,
    amount: number,
    source: CoinTransactionSource,
    description?: string,
  ): Promise<CoinTransactionResult> {
    return this.deductCoins(userId, amount, source, description);
  }

  /**
   * 扣除金币 (ShopService 使用的方法)
   */
  async deductCoins(
    userId: string,
    amount: number,
    source: CoinTransactionSource,
    description?: string,
    referenceId?: string,
    metadata?: Record<string, any>,
  ): Promise<CoinTransactionResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return await this.userRepository.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.coins < amount) {
        throw new BadRequestException(`Insufficient coins. Required: ${amount}, Available: ${user.coins}`);
      }

      const previousBalance = user.coins;
      user.coins -= amount;
      user.totalCoinsSpent = (user.totalCoinsSpent || 0) + amount;

      // Create transaction record
      const transaction = manager.create(CoinTransaction, {
        userId,
        type: CoinTransactionType.SPEND,
        source,
        amount,
        description,
        referenceId,
        metadata,
      });

      await manager.save(user);
      await manager.save(transaction);

      this.logger.log(`User ${userId} spent ${amount} coins (${source}). New balance: ${user.coins}`);

      return {
        success: true,
        previousBalance,
        newBalance: user.coins,
        amount,
      };
    });
  }

  /**
   * 检查用户是否有足够的金币
   */
  async hasEnoughCoins(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * 获取用户金币交易记录
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return { transactions, total };
  }

  /**
   * 获取交易记录 (带分页和过滤)
   */
  async getTransactions(
    userId: string,
    options: { page?: number; limit?: number; type?: CoinTransactionType; source?: CoinTransactionSource } = {},
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const { page = 1, limit = 20, type, source } = options;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    if (source) {
      queryBuilder.andWhere('transaction.source = :source', { source });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return { transactions, total };
  }

  /**
   * 获取用户金币统计
   */
  async getCoinStats(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      balance: user.coins,
      totalEarned: user.totalCoinsEarned || 0,
      totalSpent: user.totalCoinsSpent || 0,
    };
  }
}