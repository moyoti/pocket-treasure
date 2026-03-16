import { IsString, IsDateString, IsBoolean, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';
import { EventBonusType } from '../entities/game-event.entity';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  nameZh?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['rarity', 'quantity', 'coins', 'legendary_rate'])
  bonusType?: EventBonusType;

  @IsOptional()
  @IsNumber()
  bonusValue?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialItems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictedPoiTypes?: string[];

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;
}