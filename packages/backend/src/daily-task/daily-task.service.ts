import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DailyTask, TaskType, TaskStatus } from './entities/daily-task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { UserService } from '../user/user.service';
import { InventoryService } from '../inventory/inventory.service';
import { ItemService } from '../item/item.service';

@Injectable()
export class DailyTaskService implements OnModuleInit {
  private readonly logger = new Logger(DailyTaskService.name);

  constructor(
    @InjectRepository(DailyTask)
    private dailyTaskRepository: Repository<DailyTask>,
    @InjectRepository(TaskTemplate)
    private taskTemplateRepository: Repository<TaskTemplate>,
    private userService: UserService,
    private inventoryService: InventoryService,
    private itemService: ItemService,
  ) {}

  async onModuleInit() {
    // 初始化默认任务模板
    await this.initializeDefaultTemplates();
  }

  /**
   * 初始化默认任务模板
   */
  private async initializeDefaultTemplates(): Promise<void> {
    const count = await this.taskTemplateRepository.count();
    if (count === 0) {
      this.logger.log('Initializing default task templates...');

      const defaultTemplates: Partial<TaskTemplate>[] = [
        {
          taskType: TaskType.LOGIN,
          name: '每日登录',
          description: '登录游戏完成每日签到',
          rewards: { coins: 100, experience: 50 },
          targetProgress: 1,
          weight: 1,
          isActive: true,
        },
        {
          taskType: TaskType.COLLECT,
          name: '宝藏猎人',
          description: '收集任意3个宝藏',
          rewards: { coins: 150, experience: 100 },
          targetProgress: 3,
          weight: 2,
          isActive: true,
        },
        {
          taskType: TaskType.COLLECT,
          name: '收藏家',
          description: '收集5个宝藏',
          rewards: { coins: 250, experience: 150 },
          targetProgress: 5,
          weight: 1,
          isActive: true,
        },
        {
          taskType: TaskType.VISIT_POI,
          name: '探索者',
          description: '访问2个不同的地点',
          rewards: { coins: 100, experience: 80 },
          targetProgress: 2,
          weight: 2,
          isActive: true,
        },
        {
          taskType: TaskType.COLLECT_RARITY,
          name: '稀有收藏家',
          description: '收集1个稀有或更高品质的宝藏',
          rewards: { coins: 300, experience: 200 },
          targetProgress: 1,
          rarityRequirement: 'rare',
          weight: 1,
          isActive: true,
        },
        {
          taskType: TaskType.COLLECT_RARITY,
          name: '传说猎人',
          description: '收集1个传说品质的宝藏',
          rewards: { coins: 500, experience: 500 },
          targetProgress: 1,
          rarityRequirement: 'legendary',
          weight: 0.5,
          isActive: true,
        },
      ];

      for (const template of defaultTemplates) {
        const entity = this.taskTemplateRepository.create(template as TaskTemplate);
        await this.taskTemplateRepository.save(entity);
      }

      this.logger.log(`Created ${defaultTemplates.length} default task templates`);
    }
  }

  /**
   * 获取今日日期字符串 (YYYY-MM-DD)
   */
  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * 获取用户当日的任务列表，如果不存在则生成
   */
  async getUserDailyTasks(userId: string): Promise<DailyTask[]> {
    const today = this.getTodayDateString();

    // 查找用户今日的任务
    let tasks = await this.dailyTaskRepository.find({
      where: { userId, taskDate: today },
      order: { createdAt: 'ASC' },
    });

    // 如果没有任务，生成新的每日任务
    if (tasks.length === 0) {
      tasks = await this.generateDailyTasksForUser(userId, today);
    }

    return tasks;
  }

  /**
   * 为用户生成每日任务
   */
  private async generateDailyTasksForUser(userId: string, date: string): Promise<DailyTask[]> {
    // 获取所有活跃的任务模板
    const templates = await this.taskTemplateRepository.find({
      where: { isActive: true },
    });

    if (templates.length === 0) {
      this.logger.warn('No active task templates found');
      return [];
    }

    // 根据权重随机选择3个不同的任务类型
    const selectedTemplates = this.selectTasksByWeight(templates, 3);
    const tasks: DailyTask[] = [];

    for (const template of selectedTemplates) {
      const task = this.dailyTaskRepository.create({
        userId,
        taskType: template.taskType,
        taskDate: date,
        currentProgress: 0,
        targetProgress: template.targetProgress,
        status: TaskStatus.IN_PROGRESS,
        rewards: template.rewards,
        rarityRequirement: template.rarityRequirement,
      });

      tasks.push(await this.dailyTaskRepository.save(task));
    }

    this.logger.log(`Generated ${tasks.length} daily tasks for user ${userId}`);
    return tasks;
  }

  /**
   * 根据权重随机选择任务
   */
  private selectTasksByWeight(templates: TaskTemplate[], count: number): TaskTemplate[] {
    const selected: TaskTemplate[] = [];
    const available = [...templates];

    while (selected.length < count && available.length > 0) {
      const totalWeight = available.reduce((sum, t) => sum + t.weight, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < available.length; i++) {
        random -= available[i].weight;
        if (random <= 0) {
          selected.push(available[i]);
          available.splice(i, 1);
          break;
        }
      }
    }

    return selected;
  }

  /**
   * 领取任务奖励
   */
  async claimTaskReward(userId: string, taskId: string): Promise<DailyTask> {
    const task = await this.dailyTaskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new BadRequestException('This task does not belong to you');
    }

    if (task.status !== TaskStatus.COMPLETED) {
      throw new BadRequestException('Task is not completed yet');
    }

    // 更新任务状态
    task.status = TaskStatus.CLAIMED;
    task.claimedAt = new Date();
    await this.dailyTaskRepository.save(task);

    // 发放奖励
    await this.grantRewards(userId, task.rewards);

    this.logger.log(`User ${userId} claimed reward for task ${taskId}`);
    return task;
  }

  /**
   * 发放奖励
   */
  private async grantRewards(userId: string, rewards: DailyTask['rewards']): Promise<void> {
    const user = await this.userService.findById(userId);

    // 更新用户金币和经验（如果user实体有这些字段的话）
    // 由于当前user实体可能没有coins和experience字段，这里先预留
    // 实际项目中需要确保user实体有这些字段
    try {
      const updateData: Partial<any> = {};

      if (rewards.coins && user.coins !== undefined) {
        updateData.coins = (user.coins || 0) + rewards.coins;
      }

      if (rewards.experience && user.experience !== undefined) {
        updateData.experience = (user.experience || 0) + rewards.experience;
      }

      if (Object.keys(updateData).length > 0) {
        await this.userService.updateProfile(userId, updateData);
      }

      // 如果有物品奖励
      if (rewards.itemId && rewards.itemQuantity) {
        const item = await this.itemService.findById(rewards.itemId);
        if (item) {
          for (let i = 0; i < rewards.itemQuantity; i++) {
            await this.inventoryService.addItemToInventory(
              userId,
              item,
              0,
              0,
              '任务奖励',
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to grant rewards to user ${userId}: ${error.message}`);
    }
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(
    userId: string,
    taskType: TaskType,
    progress: number = 1,
    rarity?: string,
  ): Promise<void> {
    const today = this.getTodayDateString();

    // 查找用户当日进行中的指定类型任务
    const queryBuilder = this.dailyTaskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.taskDate = :today', { today })
      .andWhere('task.taskType = :taskType', { taskType })
      .andWhere('task.status = :status', { status: TaskStatus.IN_PROGRESS });

    const tasks = await queryBuilder.getMany();

    for (const task of tasks) {
      // 如果是稀有度任务，检查稀有度要求
      if (taskType === TaskType.COLLECT_RARITY && task.rarityRequirement) {
        if (!this.matchesRarityRequirement(rarity, task.rarityRequirement)) {
          continue;
        }
      }

      // 更新进度
      task.currentProgress = Math.min(task.currentProgress + progress, task.targetProgress);

      // 检查是否完成
      if (task.currentProgress >= task.targetProgress) {
        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();
      }

      await this.dailyTaskRepository.save(task);
      this.logger.debug(`Updated task ${task.id} progress to ${task.currentProgress}/${task.targetProgress}`);
    }
  }

  /**
   * 检查稀有度是否满足要求
   */
  private matchesRarityRequirement(actualRarity: string | undefined, requiredRarity: string): boolean {
    if (!actualRarity) return false;

    const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
    const actualIndex = rarityOrder.indexOf(actualRarity.toLowerCase());
    const requiredIndex = rarityOrder.indexOf(requiredRarity.toLowerCase());

    return actualIndex >= requiredIndex;
  }

  /**
   * 处理用户登录（更新登录任务进度）
   */
  async handleUserLogin(userId: string): Promise<void> {
    // 确保用户有今日任务
    await this.getUserDailyTasks(userId);

    // 更新登录任务进度
    await this.updateTaskProgress(userId, TaskType.LOGIN, 1);
  }

  /**
   * 处理物品收集（更新收集任务进度）
   */
  async handleItemCollected(userId: string, rarity: string): Promise<void> {
    // 更新普通收集任务
    await this.updateTaskProgress(userId, TaskType.COLLECT, 1);

    // 更新稀有度收集任务
    await this.updateTaskProgress(userId, TaskType.COLLECT_RARITY, 1, rarity);
  }

  /**
   * 处理POI访问（更新访问任务进度）
   */
  async handlePoiVisited(userId: string): Promise<void> {
    await this.updateTaskProgress(userId, TaskType.VISIT_POI, 1);
  }

  /**
   * 每日0点重置任务（定时任务）
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReset(): Promise<void> {
    this.logger.log('Starting daily task reset...');

    // 可以选择清理旧任务或保留作为历史记录
    // 这里我们保留旧任务，新的一天会生成新的任务

    this.logger.log('Daily task reset completed');
  }

  /**
   * 手动刷新任务（可选功能，可能需要消耗金币）
   */
  async refreshTasks(userId: string): Promise<DailyTask[]> {
    const today = this.getTodayDateString();

    // 删除今日未完成的任务
    await this.dailyTaskRepository.delete({
      userId,
      taskDate: today,
      status: TaskStatus.IN_PROGRESS,
    });

    // 生成新任务
    return this.generateDailyTasksForUser(userId, today);
  }

  /**
   * 获取用户任务统计
   */
  async getTaskStats(userId: string): Promise<{
    todayCompleted: number;
    todayTotal: number;
    todayClaimed: number;
  }> {
    const today = this.getTodayDateString();
    const tasks = await this.dailyTaskRepository.find({
      where: { userId, taskDate: today },
    });

    return {
      todayCompleted: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      todayTotal: tasks.length,
      todayClaimed: tasks.filter(t => t.status === TaskStatus.CLAIMED).length,
    };
  }
}