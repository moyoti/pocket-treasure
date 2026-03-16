import { IsString, IsNumber, Min } from 'class-validator';

export class SellItemDto {
  @IsString()
  inventoryItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}