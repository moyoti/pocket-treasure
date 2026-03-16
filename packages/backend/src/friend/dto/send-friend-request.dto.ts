import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @IsNotEmpty()
  addresseeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}

export class RespondFriendRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}

export class SearchUserDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}