import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

/**
 * Google Play Real-time Developer Notification (RTDN) payload
 * https://developer.android.com/google/play/billing/rtdn-reference
 */
export class GooglePlayNotificationPayload {
  @IsNotEmpty()
  @IsString()
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };

  @IsOptional()
  @IsString()
  subscription?: {
    purchaseToken: string;
    subscriptionId: string;
  };
}

/**
 * Google Play notification data extracted from RTDN
 */
export class GooglePlayNotificationData {
  @IsNotEmpty()
  @IsString()
  version: string;

  @IsNotEmpty()
  @IsString()
  notificationType: 'ONE_TIME_PRODUCT_PURCHASE' | 'SUBSCRIPTION_PURCHASED' | 'SUBSCRIPTION_RENEWED' | 'SUBSCRIPTION_RECOVERED' | 'SUBSCRIPTION_CANCELED' | 'SUBSCRIPTION_IN_GRACE_PERIOD' | 'SUBSCRIPTION_ON_HOLD' | 'SUBSCRIPTION_PAUSED' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_PENDING_PURCHASE' | 'PURCHASE_REVOKED' | 'EXPIRATION_PROCESSING_FAILED';

  @IsNotEmpty()
  @IsString()
  purchaseToken: string;

  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsNumber()
  expiryTimeMillis?: number;
}
