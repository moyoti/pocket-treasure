import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TradeStatus } from '../entities/trade.entity';

export class TradeItemDto {
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeItemDto)
  initiatorItems: TradeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeItemDto)
  receiverItems: TradeItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInHours?: number;
}

export class UpdateTradeItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeItemDto)
  initiatorItems: TradeItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeItemDto)
  receiverItems: TradeItemDto[];
}

export class TradeQueryDto {
  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus;

  @IsOptional()
  @IsString()
  type?: 'sent' | 'received' | 'all';
}