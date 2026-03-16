import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import { User } from '../user/entities/user.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { AchievementDefinition } from './entities/achievement-definition.entity';
import { UserAchievement } from './entities/user-achievement.entity';

@Module({
  imports: [
    TypeOrmModule,
    TypeOrmModule.forFeature([
      User,
      InventoryItem,
      AchievementDefinition,
      UserAchievement,
    ]),
  ],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}