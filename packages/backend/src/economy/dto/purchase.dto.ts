import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class PurchaseDto {
  @IsUUID()
  @IsNotEmpty()
  shopItemId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}