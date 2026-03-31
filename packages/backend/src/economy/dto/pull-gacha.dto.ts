import { IsString, IsNumber, Min, Max, IsOptional, IsEnum, IsIn } from 'class-validator';

export enum PullType {
  SINGLE = 'single',
  TEN = 'ten',
}

export enum CurrencyType {
  COINS = 'coins',
  GEMS = 'gems',
}

export class PullGachaDto {
  @IsString()
  poolId: string;

  @IsEnum(PullType)
  @IsOptional()
  pullType?: PullType = PullType.SINGLE;

  @IsIn(['coins', 'gems'])
  @IsOptional()
  currency?: CurrencyType = CurrencyType.COINS;
}