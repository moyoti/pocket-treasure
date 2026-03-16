import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DailyTaskService } from './daily-task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('daily-tasks')
@UseGuards(JwtAuthGuard)
export class DailyTaskController {
  constructor(private readonly dailyTaskService: DailyTaskService) {}

  /**
   * GET /api/daily-tasks
   * 获取用户当日任务列表
   */
  @Get()
  async getDailyTasks(@Request() req: any) {
    const tasks = await this.dailyTaskService.getUserDailyTasks(req.user.id);
    const stats = await this.dailyTaskService.getTaskStats(req.user.id);

    return {
      tasks,
      stats,
    };
  }

  /**
   * POST /api/daily-tasks/claim/:id
   * 领取任务奖励
   */
  @Post('claim/:id')
  async claimTaskReward(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) taskId: string,
  ) {
    const task = await this.dailyTaskService.claimTaskReward(req.user.id, taskId);

    return {
      success: true,
      message: '奖励领取成功',
      rewards: task.rewards,
      task,
    };
  }

  /**
   * POST /api/daily-tasks/refresh
   * 刷新任务列表
   */
  @Post('refresh')
  async refreshTasks(@Request() req: any) {
    const tasks = await this.dailyTaskService.refreshTasks(req.user.id);

    return {
      success: true,
      message: '任务刷新成功',
      tasks,
    };
  }

  /**
   * GET /api/daily-tasks/stats
   * 获取任务统计
   */
  @Get('stats')
  async getTaskStats(@Request() req: any) {
    return this.dailyTaskService.getTaskStats(req.user.id);
  }
}