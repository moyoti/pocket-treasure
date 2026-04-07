import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { RechargeService } from './services/recharge.service';
import { GooglePlayIAPService } from './services/google-play-iap.service';
import { AppleIAPService } from './services/apple-iap.service';
import { SubscriptionService } from './services/subscription.service';
import { GooglePlayNotificationPayload } from './dto/google-play-notification.dto';
import { AppleIAPVerifyRequest } from './dto/apple-iap-verify.dto';
import { AppStoreServerNotification } from './dto/apple-server-notification.dto';

@Controller('recharge')
@UseGuards(JwtAuthGuard)
export class RechargeController {
  constructor(
    private readonly rechargeService: RechargeService,
    private readonly googlePlayIAPService: GooglePlayIAPService,
    private readonly appleIAPService: AppleIAPService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Public()
  @Get('packages')
  async getPackages() {
    return this.rechargeService.getPackages();
  }

  @Public()
  @Get('packages/:id')
  async getPackage(@Param('id') id: string) {
    return this.rechargeService.getPackage(id);
  }

  @Post('orders')
  async createOrder(@Request() req: any, @Body() body: { packageId: string }) {
    return this.rechargeService.createOrder(req.user.id, body.packageId);
  }

  @Public()
  @Post('callback')
  async paymentCallback(@Body() body: { orderId: string; transactionId?: string; status: string }) {
    if (body.status === 'completed') {
      await this.rechargeService.completeOrder(body.orderId, body.transactionId || 'mock');
    } else {
      await this.rechargeService.failOrder(body.orderId);
    }
    return { success: true };
  }

  @Public()
  @Post('iap/google/notify')
  async googlePlayNotification(@Body() body: GooglePlayNotificationPayload) {
    const data = JSON.parse(Buffer.from(body.message.data, 'base64').toString('utf8'));
    const { notificationType, purchaseToken, subscriptionId, orderId } = data;

    switch (notificationType) {
      case 'ONE_TIME_PRODUCT_PURCHASE':
      case 'SUBSCRIPTION_PURCHASED':
        await this.googlePlayIAPService.verifyAndConsume(purchaseToken, subscriptionId);
        break;
      case 'SUBSCRIPTION_RENEWED':
      case 'SUBSCRIPTION_RECOVERED':
        break;
      case 'SUBSCRIPTION_CANCELED':
      case 'SUBSCRIPTION_IN_GRACE_PERIOD':
      case 'SUBSCRIPTION_ON_HOLD':
        break;
      case 'SUBSCRIPTION_EXPIRED':
      case 'EXPIRATION_PROCESSING_FAILED':
        break;
      case 'PURCHASE_REVOKED':
        await this.googlePlayIAPService.processRefund(purchaseToken);
        break;
      default:
        break;
    }

    return { success: true };
  }

  @Public()
  @Post('iap/apple/verify')
  async appleIAPVerify(@Body() body: AppleIAPVerifyRequest) {
    try {
      const result = await this.appleIAPService.validateReceipt(body.receiptData);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  @Public()
  @Post('iap/apple/notification')
  async appleServerNotification(@Body() body: AppStoreServerNotification) {
    const { notificationType, notificationUUID, timestamp, data } = body;

    try {
      switch (notificationType) {
        case 'REFUND':
          await this.appleIAPService.processRefundNotification({
            notificationType: 'REFUND',
            notificationUUID,
            timestamp,
            data: {
              signedTransactionId: data.signedTransactionInfo,
              signedDate: timestamp,
              environment: data.environment,
              transactionId: '',
              originalTransactionId: '',
            },
          });
          break;
        case 'DID_RENEW':
        case 'SUBSCRIBED':
          break;
        case 'DID_FAIL_TO_RENEW':
        case 'EXPIRED':
        case 'GRACE_PERIOD_EXPIRED':
          break;
        case 'DID_CHANGE_RENEWAL_STATUS':
        case 'DID_CHANGE_RENEWAL_PREF':
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Apple notification processing error: ${error}`);
    }

    return { received: true };
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.rechargeService.getUserRechargeHistory(req.user.id);
  }
}
