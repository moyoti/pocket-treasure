import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SpawnNearbyDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  count?: number;
}