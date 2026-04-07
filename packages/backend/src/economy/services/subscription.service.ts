import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RechargeRecord } from '../entities/recharge-record.entity';
import { GemService } from './gem.service';
import {
  SubscriptionTier,
  SubscriptionBenefit,
  SubscriptionInfo,
  SubscriptionStatus,
  PaymentChannel,
  GemTransactionSource,
} from '@treasure-hunt/shared';

// Extended subscription tier with Google product ID support
interface ExtendedSubscriptionTier extends SubscriptionTier {
  productIdGoogle?: string;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  // 订阅权益配置 (从数据库或配置读取)
  private readonly subscriptionTiers: Record<string, ExtendedSubscriptionTier> = {
    'weekly_gems': {
      id: 'weekly_gems',
      name: 'Weekly Gem Pack',
      productId: process.env.APPLE_WEEKLY_GEMS_ID || 'TODO',
      productIdGoogle: process.env.GOOGLE_WEEKLY_GEMS_ID || 'TODO',
      benefits: {
        dailyBonusGems: 50,
        exclusiveItems: [],
        gachaDiscountPercent: 0,
        maxGachaPerDay: 10,
      },
      price: 300,
    },
    'monthly_gems': {
      id: 'monthly_gems',
      name: 'Monthly Gem Pack',
      productId: process.env.APPLE_MONTHLY_GEMS_ID || 'TODO',
      productIdGoogle: process.env.GOOGLE_MONTHLY_GEMS_ID || 'TODO',
      benefits: {
        dailyBonusGems: 200,
        exclusiveItems: ['sub_badge_01', 'sub_avatar_01'],
        gachaDiscountPercent: 10,
        maxGachaPerDay: 50,
      },
      price: 999,
    },
  };

  // 记录用户每日 bonus 发放日期的 key 前缀
  private readonly DAILY_BONUS_KEY_PREFIX = 'daily_bonus_';

  constructor(
    @InjectRepository(RechargeRecord)
    private rechargeRecordRepository: Repository<RechargeRecord>,
    private gemService: GemService,
  ) {}

  /**
   * 检查用户是否有活跃订阅
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const activeSubscriptions = await this.getUserActiveSubscriptions(userId);
    return activeSubscriptions.length > 0;
  }

  /**
   * 获取用户活跃订阅列表
   */
  async getUserActiveSubscriptions(userId: string): Promise<SubscriptionInfo[]> {
    const now = new Date();

    // 查询所有订阅记录（isSubscription 为 true 且未过期）
    const subscriptionRecords = await this.rechargeRecordRepository.find({
      where: {
        userId,
        isSubscription: true,
        status: 'completed',
        expirationDate: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });

    const activeSubscriptions: SubscriptionInfo[] = [];

    for (const record of subscriptionRecords) {
      if (!record.productId) continue;
      const tier = this.getTierByProductId(record.productId);
      if (tier) {
        activeSubscriptions.push({
          productId: record.productId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: record.completedAt?.toISOString() ?? record.createdAt.toISOString(),
          currentPeriodEnd: record.expirationDate?.toISOString() ?? '',
          autoRenewing: record.autoRenewing ?? false,
          isTrial: false,
        });
      }
    }

    return activeSubscriptions;
  }

  /**
   * 授予订阅权益 (发放每日宝石)
   * 应该在用户每日登录时调用
   * @returns 返回发放宝石数
   */
  async grantDailyBonus(userId: string): Promise<number> {
    const activeSubscriptions = await this.getUserActiveSubscriptions(userId);

    if (activeSubscriptions.length === 0) {
      return 0;
    }

    // 计算用户今日是否已领取过 bonus
    // 使用 productId 作为唯一标识，取最高档位的 subscription 发放 bonus
    let totalBonusGems = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const subscription of activeSubscriptions) {
      const tier = this.getTierByProductId(subscription.productId);
      if (tier) {
        // 检查今日是否已为该 productId 发放过 bonus
        const bonusKey = `${this.DAILY_BONUS_KEY_PREFIX}${userId}_${tier.id}`;
        // TODO: 可以用 Redis 或数据库记录来防止重复发放
        // 这里简化处理，假设每日调用一次

        totalBonusGems += tier.benefits.dailyBonusGems;
        this.logger.log(`Granting daily bonus ${tier.benefits.dailyBonusGems} gems to user ${userId} for subscription ${tier.id}`);
      }
    }

    if (totalBonusGems > 0) {
      await this.gemService.addGems(
        userId,
        totalBonusGems,
        GemTransactionSource.RECHARGE, // 使用 recharge 作为 source，因为是订阅奖励
        'Subscription daily bonus',
        undefined,
        { source: 'subscription_daily_bonus' },
      );
    }

    return totalBonusGems;
  }

  /**
   * 同步订阅状态 (从 Google/Apple 获取最新状态)
   * 注意：不实际调用支付平台API，仅模拟同步逻辑
   */
  async syncSubscriptionStatus(
    userId: string,
    productId: string,
    channel: PaymentChannel,
  ): Promise<SubscriptionInfo> {
    // 查找用户的订阅记录
    const record = await this.rechargeRecordRepository.findOne({
      where: {
        userId,
        productId,
        isSubscription: true,
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('Subscription record not found');
    }

    if (!record.productId) {
      throw new BadRequestException('Subscription record has no productId');
    }

    const now = new Date();
    const isActive = record.expirationDate && record.expirationDate > now;

    return {
      productId: record.productId,
      status: isActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
      currentPeriodStart: record.completedAt?.toISOString() ?? record.createdAt.toISOString(),
      currentPeriodEnd: record.expirationDate?.toISOString() ?? '',
      autoRenewing: record.autoRenewing ?? false,
      isTrial: false,
    };
  }

  /**
   * 撤销订阅权益
   */
  async revokeSubscriptionBenefits(userId: string, productId: string): Promise<void> {
    const record = await this.rechargeRecordRepository.findOne({
      where: {
        userId,
        productId,
        isSubscription: true,
      },
    });

    if (record) {
      // 将订阅状态标记为 revoked
      record.status = 'refunded';
      await this.rechargeRecordRepository.save(record);
      this.logger.log(`Revoked subscription benefits for user ${userId}, product ${productId}`);
    }

    // TODO: 可能还需要撤销用户的 exclusiveItems 访问权限
    // 这取决于 exclusiveItems 的实现方式（可能在 User 实体或专门的表中）
  }

  /**
   * 获取用户订阅权益信息
   */
  async getUserSubscriptionBenefits(userId: string): Promise<SubscriptionBenefit[]> {
    const activeSubscriptions = await this.getUserActiveSubscriptions(userId);
    const benefits: SubscriptionBenefit[] = [];

    for (const subscription of activeSubscriptions) {
      const tier = this.getTierByProductId(subscription.productId);
      if (tier) {
        benefits.push(tier.benefits);
      }
    }

    return benefits;
  }

  /**
   * 根据 productId 获取订阅等级配置
   */
  private getTierByProductId(productId: string): SubscriptionTier | undefined {
    for (const tier of Object.values(this.subscriptionTiers)) {
      if (tier.productId === productId || tier.productIdGoogle === productId) {
        return tier;
      }
    }
    return undefined;
  }

  /**
   * 获取所有订阅等级配置
   */
  getAllTiers(): Record<string, SubscriptionTier> {
    return this.subscriptionTiers;
  }

  /**
   * 根据 ID 获取订阅等级配置
   */
  getTierById(tierId: string): SubscriptionTier | undefined {
    return this.subscriptionTiers[tierId];
  }
}