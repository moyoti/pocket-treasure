import { IsString, IsDateString, IsBoolean, IsOptional, IsNumber, IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  nameZh?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['rarity', 'quantity', 'coins', 'legendary_rate'])
  bonusType?: 'rarity' | 'quantity' | 'coins' | 'legendary_rate';

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