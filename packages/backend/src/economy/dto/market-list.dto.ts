import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemRarity } from '../../item/entities/item.entity';

export class CreateListingDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(1)
  price: number; // Price per unit
}

export class MarketQueryDto {
  @IsOptional()
  @IsEnum(ItemRarity)
  rarity?: ItemRarity;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class BuyListingDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number; // Optional: buy partial quantity
}