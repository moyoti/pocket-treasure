import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * Apple IAP purchase verification request
 * Used when client sends receipt data after purchase for server-side validation
 */
export class AppleIAPVerifyRequest {
  @IsNotEmpty()
  @IsString()
  receiptData: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

/**
 * Apple IAP verify response
 */
export class AppleIAPVerifyResponse {
  success: boolean;
  transactionId?: string;
  productId?: string;
  purchaseDate?: string;
  error?: string;
}
