import { Controller, Get, Post, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  /**
   * GET /api/achievements
   * 获取所有成就定义
   */
  @Get()
  async getAllAchievements() {
    return this.achievementService.getAllAchievements();
  }

  /**
   * GET /api/achievements/me
   * 获取用户成就进度
   */
  @Get('me')
  async getUserAchievements(@Request() req: any) {
    return this.achievementService.getUserAchievements(req.user.id);
  }

  /**
   * POST /api/achievements/claim/:id
   * 领取成就奖励
   */
  @Post('claim/:id')
  async claimAchievement(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) achievementId: string,
  ) {
    return this.achievementService.claimAchievement(req.user.id, achievementId);
  }
}