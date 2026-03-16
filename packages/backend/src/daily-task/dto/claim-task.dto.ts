import { IsNotEmpty } from 'class-validator';

export class ClaimTaskDto {
  @IsNotEmpty()
  taskId: string;
}