import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class OpenChestDto {
  @IsString()
  chestId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}