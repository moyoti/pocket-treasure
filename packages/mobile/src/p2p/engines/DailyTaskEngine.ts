import { DatabaseService } from '../database/DatabaseService';
import { DailyTaskDefinition, UserDailyTask, TaskType, TaskStatus, ItemRarity } from '../types';
import { DAILY_TASK_DEFINITIONS, getDailyTaskById } from '../data/dailyTasks';

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export class DailyTaskEngine {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    await this.db.seedDailyTaskDefinitions(DAILY_TASK_DEFINITIONS);
    await this.initTodayTasks();
  }

  async initTodayTasks(): Promise<UserDailyTask[]> {
    const today = getTodayDateString();
    return await this.db.initDailyTasksForDate(today);
  }

  async getTodayTasks(): Promise<UserDailyTask[]> {
    const today = getTodayDateString();
    return await this.db.getUserDailyTasks(today);
  }

  async getTaskDefinition(taskDefinitionId: string): Promise<DailyTaskDefinition | undefined> {
    return getDailyTaskById(taskDefinitionId);
  }

  async updateProgress(taskType: TaskType, progress: number, rarity?: string): Promise<void> {
    const today = getTodayDateString();
    const tasks = await this.getTodayTasks();

    for (const task of tasks) {
      const definition = getDailyTaskById(task.taskDefinitionId);
      if (!definition) continue;

      if (definition.taskType !== taskType) continue;

      if (definition.rarityRequirement && rarity) {
        const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
        const taskRarityIndex = rarityOrder.indexOf(definition.rarityRequirement);
        const actualRarityIndex = rarityOrder.indexOf(rarity);
        if (actualRarityIndex < taskRarityIndex) continue;
      }

      const newProgress = Math.min(task.currentProgress + progress, definition.targetProgress);
      await this.db.updateDailyTaskProgress(task.taskDefinitionId, today, newProgress);
    }
  }

  async completeTask(taskDefinitionId: string): Promise<UserDailyTask | null> {
    const today = getTodayDateString();
    const definition = getDailyTaskById(taskDefinitionId);
    if (!definition) return null;

    return await this.db.updateDailyTaskProgress(taskDefinitionId, today, definition.targetProgress);
  }

  async claimTask(taskDefinitionId: string): Promise<{
    success: boolean;
    error?: string;
    rewards?: DailyTaskDefinition['rewards'];
  }> {
    const today = getTodayDateString();
    const task = await this.db.getUserDailyTask(taskDefinitionId, today);
    
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.status !== 'completed') {
      return { success: false, error: 'Task not completed' };
    }

    if (task.claimedAt) {
      return { success: false, error: 'Already claimed' };
    }

    const claimed = await this.db.claimDailyTask(taskDefinitionId, today);
    if (!claimed) {
      return { success: false, error: 'Claim failed' };
    }

    const definition = getDailyTaskById(taskDefinitionId);
    if (definition) {
      await this.applyRewards(definition.rewards);
    }

    return { success: true, rewards: definition?.rewards };
  }

  private async applyRewards(rewards: DailyTaskDefinition['rewards']): Promise<void> {
    if (rewards.coins) {
      await this.db.addCoins(rewards.coins);
    }
    if (rewards.experience) {
      const profile = await this.db.getUserProfile();
      if (profile) {
        await this.db.updateUserProfile({ experience: profile.experience + rewards.experience });
      }
    }
  }

  async getTaskStatus(taskDefinitionId: string): Promise<TaskStatus | undefined> {
    const today = getTodayDateString();
    const task = await this.db.getUserDailyTask(taskDefinitionId, today);
    return task?.status;
  }

  async checkLoginTask(): Promise<void> {
    await this.updateProgress('login', 1);
  }

  async checkCollectTask(rarity?: ItemRarity): Promise<void> {
    await this.updateProgress('collect', 1);
    if (rarity) {
      await this.updateProgress('collect_rarity', 1, rarity);
    }
  }

  async checkVisitPoiTask(): Promise<void> {
    await this.updateProgress('visit_poi', 1);
  }
}