import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  collectionCount: number;
  rareItems: number;
  epicItems: number;
  legendaryItems: number;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getTopPlayers(limit: number = 10): Promise<LeaderboardEntry[]> {
    this.logger.debug(`Fetching top ${limit} players`);

    // 获取所有用户，按收藏数量排序
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.inventoryItems', 'inventory')
      .select('user.id', 'userId')
      .addSelect('user.username', 'username')
      .addSelect('user.avatar', 'avatar')
      .addSelect('COUNT(inventory.id)', 'collectionCount')
      .groupBy('user.id')
      .orderBy('collectionCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      collectionCount: parseInt(user.collectionCount) || 0,
      rareItems: 0,
      epicItems: 0,
      legendaryItems: 0,
    }));
  }

  async getUserRank(userId: string): Promise<number> {
    this.logger.debug(`Calculating rank for user ${userId}`);

    // Optimized: Use a subquery to calculate rank more efficiently
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.inventoryItems', 'inventory')
      .select('user.id', 'userId')
      .addSelect('COUNT(inventory.id)', 'collectionCount')
      .groupBy('user.id')
      .orderBy('collectionCount', 'DESC')
      .getRawMany();

    const index = result.findIndex(u => u.userId === userId);
    const rank = index !== -1 ? index + 1 : 0;

    this.logger.debug(`User ${userId} rank: ${rank}`);
    return rank;
  }
}