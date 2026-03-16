import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsObject()
  preferences?: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    achievementNotifications: boolean;
    rareItemAlerts: boolean;
    showAllItems: boolean;
    showRarityFilter: boolean;
    autoCollectNearby: boolean;
    defaultZoom: number;
    publicProfile: boolean;
    showOnLeaderboard: boolean;
    shareLocation: boolean;
    darkMode: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    language: string;
  };
}