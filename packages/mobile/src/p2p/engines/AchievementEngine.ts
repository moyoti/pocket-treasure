import { DatabaseService } from '../database/DatabaseService';
import { AchievementDefinition, UserAchievement, AchievementType, AchievementStatus } from '../types';
import { ACHIEVEMENT_DEFINITIONS, getAchievementById } from '../data/achievements';

export class AchievementEngine {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    await this.db.seedAchievements(ACHIEVEMENT_DEFINITIONS);
    await this.db.initUserAchievements();
  }

  async getAchievements(): Promise<AchievementDefinition[]> {
    return await this.db.getAchievements();
  }

  async getUserAchievements(): Promise<UserAchievement[]> {
    return await this.db.getUserAchievements();
  }

  async getAchievement(achievementId: string): Promise<AchievementDefinition | undefined> {
    return getAchievementById(achievementId);
  }

  async getUserAchievement(achievementId: string): Promise<UserAchievement | null> {
    return await this.db.getUserAchievement(achievementId);
  }

  async updateProgress(achievementId: string, progress: number): Promise<UserAchievement | null> {
    return await this.db.updateAchievementProgress(achievementId, progress);
  }

  async incrementProgress(achievementId: string, amount: number = 1): Promise<UserAchievement | null> {
    const current = await this.db.getUserAchievement(achievementId);
    if (!current) return null;

    const newProgress = current.progress + amount;
    return await this.db.updateAchievementProgress(achievementId, newProgress);
  }

  async updateByType(type: AchievementType, progress: number, rarity?: string): Promise<void> {
    const achievements = await this.getAchievements();
    const relevantAchievements = achievements.filter(ach => ach.type === type && !ach.isHidden);

    for (const ach of relevantAchievements) {
      if (ach.rarityRequirement && rarity) {
        const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
        const achRarityIndex = rarityOrder.indexOf(ach.rarityRequirement);
        const actualRarityIndex = rarityOrder.indexOf(rarity);
        if (actualRarityIndex < achRarityIndex) continue;
      }

      const userAch = await this.db.getUserAchievement(ach.id);
      if (!userAch || userAch.status === 'claimed') continue;

      const currentProgress = userAch.progress;
      const tierAchievements = achievements
        .filter(a => a.type === type && a.tier <= ach.tier)
        .sort((a, b) => a.requirement - b.requirement);

      for (const tierAch of tierAchievements) {
        const tierUserAch = await this.db.getUserAchievement(tierAch.id);
        if (!tierUserAch || tierUserAch.status !== 'in_progress') continue;

        if (progress >= tierAch.requirement && currentProgress < tierAch.requirement) {
          await this.db.updateAchievementProgress(tierAch.id, tierAch.requirement);
        } else if (progress < tierAch.requirement) {
          await this.db.updateAchievementProgress(tierAch.id, progress);
        }
      }
    }
  }

  async claimAchievement(achievementId: string): Promise<{
    success: boolean;
    error?: string;
    rewards?: AchievementDefinition['rewards'];
  }> {
    const userAch = await this.db.getUserAchievement(achievementId);
    
    if (!userAch) {
      return { success: false, error: 'Achievement not found' };
    }

    if (userAch.status !== 'completed') {
      return { success: false, error: 'Achievement not completed' };
    }

    if (userAch.claimedAt) {
      return { success: false, error: 'Already claimed' };
    }

    const claimed = await this.db.claimAchievement(achievementId);
    if (!claimed) {
      return { success: false, error: 'Claim failed' };
    }

    const definition = getAchievementById(achievementId);
    if (definition) {
      await this.applyRewards(definition.rewards);
    }

    return { success: true, rewards: definition?.rewards };
  }

  private async applyRewards(rewards: AchievementDefinition['rewards']): Promise<void> {
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

  async checkCollectionAchievement(uniqueItemCount: number): Promise<void> {
    await this.updateByType('collection', uniqueItemCount);
  }

  async checkRarityAchievement(rarity: string): Promise<void> {
    const achievements = await this.getAchievements();
    const rarityAchievements = achievements.filter(ach => ach.type === 'rarity');

    for (const ach of rarityAchievements) {
      if (!ach.rarityRequirement) continue;

      const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
      const achRarityIndex = rarityOrder.indexOf(ach.rarityRequirement);
      const actualRarityIndex = rarityOrder.indexOf(rarity);

      if (actualRarityIndex >= achRarityIndex) {
        await this.incrementProgress(ach.id, 1);
      }
    }
  }

  async checkStreakAchievement(streakDays: number): Promise<void> {
    await this.updateByType('streak', streakDays);
  }

  async checkDistanceAchievement(distanceKm: number): Promise<void> {
    await this.updateByType('distance', distanceKm);
  }

  async getCompletedAchievements(): Promise<UserAchievement[]> {
    const userAchs = await this.getUserAchievements();
    return userAchs.filter(ua => ua.status === 'completed' || ua.status === 'claimed');
  }

  async getUnclaimedAchievements(): Promise<UserAchievement[]> {
    const userAchs = await this.getUserAchievements();
    return userAchs.filter(ua => ua.status === 'completed' && !ua.claimedAt);
  }

  async getProgressPercentage(achievementId: string): Promise<number> {
    const definition = getAchievementById(achievementId);
    const userAch = await this.db.getUserAchievement(achievementId);

    if (!definition || !userAch) return 0;

    return Math.min(100, Math.floor((userAch.progress / definition.requirement) * 100));
  }
}