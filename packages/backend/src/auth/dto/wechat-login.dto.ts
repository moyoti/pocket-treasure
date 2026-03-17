import { IsOptional, IsString } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  @IsOptional()
  code?: string;
}
