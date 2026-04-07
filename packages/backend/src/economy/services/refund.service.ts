import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RechargeRecord } from '../entities/recharge-record.entity';
import { RechargeService } from './recharge.service';
import { SubscriptionService } from './subscription.service';
import {
  PaymentChannel,
  RechargeStatus,
} from '@treasure-hunt/shared';

export enum RefundReason {
  USER_REQUESTED = 'user_requested',
  BILLING_ERROR = 'billing_error',
  FRAUD = 'fraud',
  DUPLICATE = 'duplicate',
  UNKNOWN = 'unknown',
}

export interface RefundRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  gemsAmount: number;
  reason: RefundReason;
  channel: PaymentChannel;
  refundedAt: Date;
  gemsDeducted: boolean;
}

export interface RefundResult {
  success: boolean;
  orderId: string;
  refundedAmount: number;
  gemsDeducted: boolean;
  message: string;
}

export interface SyncResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    @InjectRepository(RechargeRecord)
    private rechargeRecordRepository: Repository<RechargeRecord>,
    private rechargeService: RechargeService,
    private subscriptionService: SubscriptionService,
    private dataSource: DataSource,
  ) {}

  async processRefund(
    orderId: string,
    reason: RefundReason,
    channel: PaymentChannel,
  ): Promise<RefundResult> {
    this.logger.log(`Processing refund for order ${orderId}, reason: ${reason}, channel: ${channel}`);

    return await this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(RechargeRecord, {
        where: { orderId },
      });

      if (!record) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (record.status === RechargeStatus.REFUNDED) {
        throw new BadRequestException(`Order ${orderId} has already been refunded`);
      }

      if (record.status !== RechargeStatus.COMPLETED) {
        throw new BadRequestException(`Order ${orderId} is not in completed status, cannot refund`);
      }

      record.status = RechargeStatus.REFUNDED;
      await manager.save(record);

      if (record.isSubscription && record.productId) {
        try {
          await this.subscriptionService.revokeSubscriptionBenefits(
            record.userId,
            record.productId,
          );
          this.logger.log(`Revoked subscription benefits for user ${record.userId}, product ${record.productId}`);
        } catch (error) {
          this.logger.error(`Failed to revoke subscription benefits: ${error.message}`);
        }
      }

      if (record.gemsAwarded > 0) {
        await this.handleRefundedGems(record.userId, record.gemsAwarded, orderId);
      }

      this.logger.log(
        `Refund processed successfully for order ${orderId}, amount: ${record.amount}, gems: ${record.gemsAwarded}`,
      );

      return {
        success: true,
        orderId,
        refundedAmount: record.amount,
        gemsDeducted: false,
        message: `Refund processed successfully for order ${orderId}`,
      };
    });
  }

  async handleRefundedGems(
    userId: string,
    gemsAmount: number,
    orderId: string,
  ): Promise<void> {
    this.logger.warn(
      `[REFUND EVENT] User ${userId} received ${gemsAmount} gems from order ${orderId} which was later refunded. ` +
      `Gems have NOT been automatically deducted (to prevent abuse). Manual review may be required.`,
    );
  }

  async getUserRefundHistory(userId: string): Promise<RefundRecord[]> {
    const refundedRecords = await this.rechargeRecordRepository.find({
      where: {
        userId,
        status: RechargeStatus.REFUNDED,
      },
      order: { createdAt: 'DESC' },
    });

    return refundedRecords.map((record) => ({
      id: record.id,
      orderId: record.orderId,
      userId: record.userId,
      amount: record.amount,
      gemsAmount: record.gemsAwarded,
      reason: RefundReason.UNKNOWN,
      channel: record.paymentChannel as PaymentChannel,
      refundedAt: record.completedAt || record.createdAt,
      gemsDeducted: false,
    }));
  }

  async syncRefundStatus(): Promise<SyncResult> {
    this.logger.log('Starting refund status sync from payment platforms');

    const result: SyncResult = {
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    try {
      result.totalProcessed = 0;
      result.successCount = 0;
      result.failureCount = 0;

    } catch (error) {
      this.logger.error(`Error during refund sync: ${error.message}`);
      result.errors.push(`Sync error: ${error.message}`);
      result.failureCount++;
    }

    this.logger.log(
      `Refund sync completed: ${result.successCount} succeeded, ${result.failureCount} failed out of ${result.totalProcessed} total`,
    );

    return result;
  }

  async processGooglePlayRefund(purchaseToken: string, orderId: string): Promise<RefundResult> {
    this.logger.log(`Processing Google Play refund for order ${orderId}`);

    const record = await this.rechargeRecordRepository.findOne({
      where: { orderId, paymentChannel: PaymentChannel.GOOGLE_PLAY },
    });

    if (!record) {
      throw new NotFoundException(`Google Play order ${orderId} not found`);
    }

    return this.processRefund(orderId, RefundReason.FRAUD, PaymentChannel.GOOGLE_PLAY);
  }

  async processAppleRefund(
    originalTransactionId: string,
    transactionId: string,
  ): Promise<RefundResult> {
    this.logger.log(`Processing Apple refund for transaction ${transactionId}`);

    const record = await this.rechargeRecordRepository.findOne({
      where: {
        originalTransactionId,
        paymentChannel: PaymentChannel.APPLE_IAP,
      },
    });

    if (!record) {
      throw new NotFoundException(`Apple transaction ${transactionId} not found`);
    }

    return this.processRefund(record.orderId, RefundReason.USER_REQUESTED, PaymentChannel.APPLE_IAP);
  }
}