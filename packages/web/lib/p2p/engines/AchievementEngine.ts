import { databaseService } from '../database';
import { AchievementDefinition, UserAchievement, AchievementType, AchievementStatus, SeriesProgress, SeriesCategory, SeriesDefinition } from '../types';
import { ACHIEVEMENT_DEFINITIONS, getAchievementById } from '../data/achievements';
import { COLLECTION_SERIES, getSeriesById, checkItemInSeries } from '../data/series';

export class AchievementEngine {
  private db: any;

  constructor(db: any) {
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

  async initializeSeriesProgress(): Promise<void> {
    for (const series of COLLECTION_SERIES) {
      await this.db.initSeriesProgress({
        id: series.id,
        name: series.name,
        nameZh: series.nameZh,
        category: series.category,
        requiredItems: series.requiredItems,
      });
    }
  }

  async getSeriesProgress(): Promise<SeriesProgress[]> {
    return await this.db.getSeriesProgress();
  }

  async getSeriesProgressById(seriesId: string): Promise<SeriesProgress | null> {
    return await this.db.getSeriesProgressById(seriesId);
  }

  async updateSeriesProgressOnCollect(itemId: string): Promise<SeriesProgress[]> {
    const affectedSeries = checkItemInSeries(itemId);
    const updatedProgress: SeriesProgress[] = [];

    for (const series of affectedSeries) {
      const currentProgress = await this.db.getSeriesProgressById(series.id);
      if (!currentProgress) continue;

      const inventory = await this.db.getInventory();
      const collectedItems = inventory
        .filter(i => series.requiredItems.includes(i.itemId))
        .map(i => i.itemId);

      const uniqueCollected = [...new Set(collectedItems)];
      const updated = await this.db.updateSeriesProgress(series.id, uniqueCollected);

      if (updated) {
        updatedProgress.push(updated);
      }
    }

    return updatedProgress;
  }

  async recalculateAllSeriesProgress(): Promise<void> {
    const inventory = await this.db.getInventory();
    const collectedItemIds = inventory.map(i => i.itemId);

    for (const series of COLLECTION_SERIES) {
      const uniqueCollected = collectedItemIds.filter(id => series.requiredItems.includes(id));
      const uniqueItems = [...new Set(uniqueCollected)];
      await this.db.updateSeriesProgress(series.id, uniqueItems);
    }
  }

  async claimSeriesMilestone(seriesId: string, milestone: '25' | '50' | '75' | 'completion'): Promise<{
    success: boolean;
    error?: string;
    rewards?: { coins: number; experience: number; itemId?: string; title?: string };
  }> {
    const seriesDef = getSeriesById(seriesId);
    const progress = await this.db.getSeriesProgressById(seriesId);

    if (!seriesDef || !progress) {
      return { success: false, error: 'Series not found' };
    }

    const milestoneThreshold = milestone === '25' ? 25 : milestone === '50' ? 50 : milestone === '75' ? 75 : 100;
    const milestoneKey = milestone === 'completion' ? 'isCompleted' : `milestone${milestone}`;

    if (milestone === 'completion' && !progress.isCompleted) {
      return { success: false, error: 'Series not completed' };
    }

    if (milestone !== 'completion' && progress.progressPercent < milestoneThreshold) {
      return { success: false, error: `Milestone ${milestone}% not reached` };
    }

    if (progress.rewardsClaimed.includes(milestone)) {
      return { success: false, error: 'Already claimed' };
    }

    const rewards = milestone === '25' ? seriesDef.rewards.milestone25
      : milestone === '50' ? seriesDef.rewards.milestone50
      : milestone === '75' ? seriesDef.rewards.milestone75
      : seriesDef.rewards.completion;

    if (!rewards) {
      return { success: false, error: 'No rewards for this milestone' };
    }

    const claimed = await this.db.claimSeriesReward(seriesId, milestone);
    if (!claimed) {
      return { success: false, error: 'Claim failed' };
    }

    await this.applySeriesRewards(rewards);

    return { success: true, rewards };
  }

  private async applySeriesRewards(rewards: { coins: number; experience: number; itemId?: string; title?: string }): Promise<void> {
    await this.db.addCoins(rewards.coins);

    const profile = await this.db.getUserProfile();
    if (profile) {
      await this.db.updateUserProfile({ experience: profile.experience + rewards.experience });
    }

    if (rewards.itemId) {
      const itemDef = await this.db.getItemById(rewards.itemId);
      if (itemDef) {
        await this.db.addInventoryItem({
          id: `${rewards.itemId}_${Date.now()}`,
          itemId: rewards.itemId,
          quantity: 1,
          sourceSignature: 'series_reward',
          collectedAt: Date.now(),
          isLocked: false,
        });
      }
    }
  }

  async getSeriesByCategory(category: SeriesCategory): Promise<{ definition: SeriesDefinition; progress: SeriesProgress | null }[]> {
    const seriesInCategory = COLLECTION_SERIES.filter(s => s.category === category);
    const results: { definition: SeriesDefinition; progress: SeriesProgress | null }[] = [];

    for (const series of seriesInCategory) {
      const progress = await this.db.getSeriesProgressById(series.id);
      results.push({ definition: series, progress });
    }

    return results;
  }

  async getVisibleSeries(): Promise<{ definition: SeriesDefinition; progress: SeriesProgress | null }[]> {
    const visible = COLLECTION_SERIES.filter(s => !s.isHidden);
    const results: { definition: SeriesDefinition; progress: SeriesProgress | null }[] = [];

    for (const series of visible) {
      const progress = await this.db.getSeriesProgressById(series.id);
      results.push({ definition: series, progress });
    }

    return results;
  }

  async getHiddenSeries(): Promise<{ definition: SeriesDefinition; progress: SeriesProgress | null }[]> {
    const hidden = COLLECTION_SERIES.filter(s => s.isHidden);
    const results: { definition: SeriesDefinition; progress: SeriesProgress | null }[] = [];

    for (const series of hidden) {
      const progress = await this.db.getSeriesProgressById(series.id);
      results.push({ definition: series, progress });
    }

    return results;
  }
}