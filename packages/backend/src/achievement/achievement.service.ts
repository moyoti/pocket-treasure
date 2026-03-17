import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import {
  AchievementDefinition,
  AchievementType,
  AchievementRewards,
} from './entities/achievement-definition.entity';
import {
  UserAchievement,
  AchievementStatus,
} from './entities/user-achievement.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { ItemRarity } from '../item/entities/item.entity';

// 默认成就定义
const DEFAULT_ACHIEVEMENTS: Partial<AchievementDefinition>[] = [
  {
    name: '初次收藏',
    description: '收集第一个宝藏',
    icon: '🎯',
    type: AchievementType.COLLECTION,
    requirement: 1,
    tier: 1,
    rewards: { coins: 10, experience: 5 },
  },
  {
    name: '收藏新手',
    description: '收集10个宝藏',
    icon: '📦',
    type: AchievementType.COLLECTION,
    requirement: 10,
    tier: 2,
    rewards: { coins: 50, experience: 25 },
  },
  {
    name: '收藏达人',
    description: '收集50个宝藏',
    icon: '🎁',
    type: AchievementType.COLLECTION,
    requirement: 50,
    tier: 3,
    rewards: { coins: 200, experience: 100 },
  },
  {
    name: '收藏大师',
    description: '收集100个宝藏',
    icon: '👑',
    type: AchievementType.COLLECTION,
    requirement: 100,
    tier: 4,
    rewards: { coins: 500, experience: 250 },
  },
  {
    name: '稀有发现',
    description: '获得一件稀有物品',
    icon: '💎',
    type: AchievementType.RARITY,
    requirement: 1,
    rarityRequirement: ItemRarity.RARE,
    tier: 2,
    rewards: { coins: 100, experience: 50 },
  },
  {
    name: '史诗收获',
    description: '获得一件史诗物品',
    icon: '🌟',
    type: AchievementType.RARITY,
    requirement: 1,
    rarityRequirement: ItemRarity.EPIC,
    tier: 3,
    rewards: { coins: 300, experience: 150 },
  },
  {
    name: '传说猎人',
    description: '获得一件传说物品',
    icon: '🏆',
    type: AchievementType.RARITY,
    requirement: 1,
    rarityRequirement: ItemRarity.LEGENDARY,
    tier: 4,
    rewards: { coins: 1000, experience: 500, title: '传说猎人' },
  },
  {
    name: '连续登录3天',
    description: '连续登录3天',
    icon: '📅',
    type: AchievementType.STREAK,
    requirement: 3,
    tier: 1,
    rewards: { coins: 30, experience: 15 },
  },
  {
    name: '连续登录7天',
    description: '连续登录7天',
    icon: '🗓️',
    type: AchievementType.STREAK,
    requirement: 7,
    tier: 2,
    rewards: { coins: 100, experience: 50 },
  },
  {
    name: '连续登录30天',
    description: '连续登录30天',
    icon: '🏆',
    type: AchievementType.STREAK,
    requirement: 30,
    tier: 4,
    rewards: { coins: 1000, experience: 500, title: '忠实玩家' },
  },
];

export interface AchievementProgress {
  achievement: AchievementDefinition;
  progress: number;
  requirement: number;
  status: AchievementStatus;
  completedAt: Date | null;
  claimedAt: Date | null;
  canClaim: boolean;
}

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AchievementDefinition)
    private achievementDefinitionRepository: Repository<AchievementDefinition>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
  ) {}

  /**
   * 初始化默认成就定义
   */
  async initializeAchievements(): Promise<void> {
    const count = await this.achievementDefinitionRepository.count();
    if (count === 0) {
      this.logger.log('Initializing default achievements...');
      for (const achievementData of DEFAULT_ACHIEVEMENTS) {
        const achievement = this.achievementDefinitionRepository.create(achievementData);
        await this.achievementDefinitionRepository.save(achievement);
      }
      this.logger.log('Default achievements initialized');
    }
  }

  /**
   * 获取所有成就定义
   */
  async getAllAchievements(): Promise<AchievementDefinition[]> {
    await this.initializeAchievements();
    return this.achievementDefinitionRepository.find({
      where: { isActive: true },
      order: { tier: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * 获取用户成就进度
   */
  async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    await this.initializeAchievements();

    const achievements = await this.getAllAchievements();
    const userAchievements = await this.userAchievementRepository.find({
      where: { userId },
      relations: ['achievement'],
    });

    // 获取用户统计数据
    const collectionCount = await this.inventoryItemRepository.count({
      where: { userId },
    });

    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 获取稀有度统计
    const rarityCounts = await this.inventoryItemRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.item', 'item')
      .select('item.rarity', 'rarity')
      .addSelect('SUM(inventory.quantity)', 'count')
      .where('inventory.userId = :userId', { userId })
      .groupBy('item.rarity')
      .getRawMany();

    const rarityMap = new Map<string, number>();
    for (const row of rarityCounts) {
      rarityMap.set(row.rarity, parseInt(row.count));
    }

    // 构建成就进度映射
    const userAchievementMap = new Map<string, UserAchievement>();
    for (const ua of userAchievements) {
      userAchievementMap.set(ua.achievementId, ua);
    }

    // 计算每个成就的进度
    return achievements.map((achievement) => {
      const userAchievement = userAchievementMap.get(achievement.id);
      let progress = 0;

      // 根据成就类型计算进度
      switch (achievement.type) {
        case AchievementType.COLLECTION:
          progress = collectionCount;
          break;
        case AchievementType.RARITY:
          if (achievement.rarityRequirement) {
            progress = rarityMap.get(achievement.rarityRequirement) || 0;
          }
          break;
        case AchievementType.STREAK:
          progress = user?.loginStreak || 0;
          break;
        default:
          progress = userAchievement?.progress || 0;
      }

      const completed = progress >= achievement.requirement;
      const status = userAchievement?.status || (completed ? AchievementStatus.COMPLETED : AchievementStatus.IN_PROGRESS);
      const canClaim = completed && status !== AchievementStatus.CLAIMED;

      return {
        achievement,
        progress,
        requirement: achievement.requirement,
        status: status,
        completedAt: userAchievement?.completedAt || (completed ? new Date() : null),
        claimedAt: userAchievement?.claimedAt || null,
        canClaim,
      };
    });
  }

  /**
   * 领取成就奖励
   */
  async claimAchievement(userId: string, achievementId: string): Promise<{ success: boolean; rewards: AchievementRewards; newCoins: number; newExperience: number; newLevel: number }> {
    await this.initializeAchievements();

    const achievement = await this.achievementDefinitionRepository.findOne({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new NotFoundException('成就不存在');
    }

    // 检查用户成就进度
    let userAchievement = await this.userAchievementRepository.findOne({
      where: { userId, achievementId },
    });

    // 获取当前进度
    const progressData = await this.calculateProgress(userId, achievement);

    if (progressData.progress < achievement.requirement) {
      throw new BadRequestException('尚未完成该成就');
    }

    if (userAchievement?.status === AchievementStatus.CLAIMED) {
      throw new BadRequestException('奖励已领取');
    }

    // 使用事务更新用户数据和成就状态
    return await this.userRepository.manager.transaction(async (manager) => {
      // 创建或更新用户成就记录
      if (!userAchievement) {
        userAchievement = this.userAchievementRepository.create({
          userId,
          achievementId,
          progress: progressData.progress,
          status: AchievementStatus.CLAIMED,
          completedAt: new Date(),
          claimedAt: new Date(),
        });
      } else {
        userAchievement.status = AchievementStatus.CLAIMED;
        userAchievement.claimedAt = new Date();
        userAchievement.progress = progressData.progress;
      }

      await manager.save(userAchievement);

      // 更新用户金币和经验
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const rewards = achievement.rewards || { coins: 0, experience: 0 };

      if (achievement.rewards) {
        user.coins += achievement.rewards.coins || 0;
        user.experience += achievement.rewards.experience || 0;

        // 计算等级提升 (每100经验升一级)
        const newLevel = Math.floor(user.experience / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }

        await manager.save(user);
      }

      return {
        success: true,
        rewards,
        newCoins: user.coins,
        newExperience: user.experience,
        newLevel: user.level,
      };
    });
  }

  /**
   * 计算指定成就的进度
   */
  private async calculateProgress(
    userId: string,
    achievement: AchievementDefinition,
  ): Promise<{ progress: number }> {
    let progress = 0;

    switch (achievement.type) {
      case AchievementType.COLLECTION:
        progress = await this.inventoryItemRepository.count({
          where: { userId },
        });
        break;

      case AchievementType.RARITY:
        if (achievement.rarityRequirement) {
          const result = await this.inventoryItemRepository
            .createQueryBuilder('inventory')
            .leftJoin('inventory.item', 'item')
            .where('inventory.userId = :userId', { userId })
            .andWhere('item.rarity = :rarity', {
              rarity: achievement.rarityRequirement,
            })
            .getCount();
          progress = result;
        }
        break;

      case AchievementType.STREAK:
        const user = await this.userRepository.findOne({ where: { id: userId } });
        progress = user?.loginStreak || 0;
        break;

      default:
        const userAchievement = await this.userAchievementRepository.findOne({
          where: { userId, achievementId: achievement.id },
        });
        progress = userAchievement?.progress || 0;
    }

    return { progress };
  }

  /**
   * 更新成就进度（在用户收集物品时调用）
   */
  async updateProgressOnCollect(
    userId: string,
    itemRarity: ItemRarity,
  ): Promise<void> {
    await this.initializeAchievements();

    // 获取所有相关成就
    const achievements = await this.achievementDefinitionRepository.find({
      where: [
        { type: AchievementType.COLLECTION, isActive: true },
        { type: AchievementType.RARITY, isActive: true },
      ],
    });

    for (const achievement of achievements) {
      // 检查稀有度成就是否匹配
      if (
        achievement.type === AchievementType.RARITY &&
        achievement.rarityRequirement !== itemRarity
      ) {
        continue;
      }

      // 检查是否已有记录
      let userAchievement = await this.userAchievementRepository.findOne({
        where: { userId, achievementId: achievement.id },
      });

      if (userAchievement?.status === AchievementStatus.CLAIMED) {
        continue; // 已领取，跳过
      }

      const progressData = await this.calculateProgress(userId, achievement);
      const completed = progressData.progress >= achievement.requirement;

      if (!userAchievement) {
        userAchievement = this.userAchievementRepository.create({
          userId,
          achievementId: achievement.id,
          progress: progressData.progress,
          status: completed ? AchievementStatus.COMPLETED : AchievementStatus.IN_PROGRESS,
          completedAt: completed ? new Date() : undefined,
        });
      } else {
        userAchievement.progress = progressData.progress;
        if (completed && userAchievement.status === AchievementStatus.IN_PROGRESS) {
          userAchievement.status = AchievementStatus.COMPLETED;
          userAchievement.completedAt = new Date();
        }
      }

      await this.userAchievementRepository.save(userAchievement);
    }
  }

  /**
   * 更新登录连续天数成就
   */
  async updateStreakAchievements(userId: string): Promise<void> {
    await this.initializeAchievements();

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const streakAchievements = await this.achievementDefinitionRepository.find({
      where: { type: AchievementType.STREAK, isActive: true },
    });

    for (const achievement of streakAchievements) {
      let userAchievement = await this.userAchievementRepository.findOne({
        where: { userId, achievementId: achievement.id },
      });

      if (userAchievement?.status === AchievementStatus.CLAIMED) {
        continue;
      }

      const completed = user.loginStreak >= achievement.requirement;

      if (!userAchievement) {
        userAchievement = this.userAchievementRepository.create({
          userId,
          achievementId: achievement.id,
          progress: user.loginStreak,
          status: completed ? AchievementStatus.COMPLETED : AchievementStatus.IN_PROGRESS,
          completedAt: completed ? new Date() : undefined,
        });
      } else {
        userAchievement.progress = user.loginStreak;
        if (completed && userAchievement.status === AchievementStatus.IN_PROGRESS) {
          userAchievement.status = AchievementStatus.COMPLETED;
          userAchievement.completedAt = new Date();
        }
      }

      await this.userAchievementRepository.save(userAchievement);
    }
  }
}