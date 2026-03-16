import { IsString, IsNumber, Min, Max, IsOptional, IsEnum } from 'class-validator';

export enum PullType {
  SINGLE = 'single',
  TEN = 'ten',
}

export class PullGachaDto {
  @IsString()
  poolId: string;

  @IsEnum(PullType)
  @IsOptional()
  pullType?: PullType = PullType.SINGLE;
}