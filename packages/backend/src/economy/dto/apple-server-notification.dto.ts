import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class AppStoreServerNotificationData {
  @IsNotEmpty()
  @IsString()
  appAppleId: string;

  @IsNotEmpty()
  @IsString()
  bundleId: string;

  @IsNotEmpty()
  @IsString()
  environment: 'PRODUCTION' | 'SANDBOX';

  signedTransactionInfo: string;
  signedRenewalInfo?: string;
}

export class AppStoreServerNotification {
  @IsNotEmpty()
  @IsString()
  notificationType: string;

  @IsNotEmpty()
  @IsString()
  notificationUUID: string;

  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @IsNotEmpty()
  data: AppStoreServerNotificationData;
}

/**
 * Apple notification types
 * https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
 */
export enum AppleNotificationType {
  OFFER_REDEEMED = 'OFFER_REDEEMED',
  DID_RENEW = 'DID_RENEW',
  EXPIRED = 'EXPIRED',
  DID_FAIL_TO_RENEW = 'DID_FAIL_TO_RENEW',
  ACCOUNT_KILLED = 'ACCOUNT_KILLED',
  SUBSCRIPTION_PAUSING = 'SUBSCRIPTION_PAUSING',
  SUBSCRIPTION_EXTENDED = 'SUBSCRIPTION_EXTENDED',
  SUBSCRIPTION_REactivated = 'SUBSCRIPTION_REACTIVATED',
  DID_CHANGE_RENEWAL_PREF = 'DID_CHANGE_RENEWAL_PREF',
  DID_CHANGE_RENEWAL_STATUS = 'DID_CHANGE_RENEWAL_STATUS',
  GRACE_PERIOD_EXPIRED = 'GRACE_PERIOD_EXPIRED',
  PRICE_INCREASE_AGREED = 'PRICE_INCREASE_AGREED',
  PRICE_INCREASE_DECLINED = 'PRICE_INCREASE_DECLINED',
  REFUND = 'REFUND',
  REFUND_DECLINED = 'REFUND_DECLINED',
  SUBSCRIBED = 'SUBSCRIBED',
  SUMMARY = 'SUMMARY',
}

/**
 * Parsed notification data
 */
export class ParsedNotificationData {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: string;
  expirationDate?: string;
  webOrderLineItemId?: string;
  environment: 'PRODUCTION' | 'SANDBOX';
}
