import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceHistoryQueryDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(90)
  days?: number = 30;
}

export class RecentSalesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  itemId?: string;
}

export class MarketStatsQueryDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;
}

export class PriceHistoryItem {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volume: number;
}

export class RecentSaleItem {
  id: string;
  itemName: string;
  itemRarity: string;
  unitPrice: number;
  quantity: number;
  soldAt: string;
  sellerName?: string;
}

export class ItemMarketStats {
  avgPrice: number;
  lastSalePrice: number;
  totalVolume: number;
  activeListings: number;
  priceChange7d: number;
  priceChange30d: number;
}
