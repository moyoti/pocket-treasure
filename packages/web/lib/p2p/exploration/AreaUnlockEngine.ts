import { AreaDefinition, VisitedArea, UserProfile, InventoryItem } from '../types';
import { AREAS, getAreaById } from '../data/areas';
import { databaseService } from '../database';

interface UnlockCheckResult {
  canUnlock: boolean;
  missingConditions: string[];
  currentProgress: {
    visitCount?: number;
    level?: number;
    itemsCollected?: string[];
  };
}

export class AreaUnlockEngine {
  async checkAreaUnlock(areaId: string): Promise<UnlockCheckResult> {
    const area = getAreaById(areaId);
    if (!area) {
      return {
        canUnlock: false,
        missingConditions: ['Area not found'],
        currentProgress: {},
      };
    }

    const visited = await databaseService.getVisitedAreas();
    const existingVisit = visited.find(v => v.areaId === areaId);
    const profile = await databaseService.getUserProfile();
    const inventory = await databaseService.getInventory();

    const missingConditions: string[] = [];
    const currentProgress: UnlockCheckResult['currentProgress'] = {};

    if (!area.unlockConditions) {
      return {
        canUnlock: existingVisit ? existingVisit.visitCount > 0 : false,
        missingConditions: [],
        currentProgress: { visitCount: existingVisit?.visitCount || 0 },
      };
    }

    if (area.unlockConditions.minVisitCount) {
      const visitCount = existingVisit?.visitCount || 0;
      currentProgress.visitCount = visitCount;

      if (visitCount < area.unlockConditions.minVisitCount) {
        missingConditions.push(`Need ${area.unlockConditions.minVisitCount} visits (current: ${visitCount})`);
      }
    }

    if (area.unlockConditions.minLevel) {
      const level = profile?.level || 1;
      currentProgress.level = level;

      if (level < area.unlockConditions.minLevel) {
        missingConditions.push(`Need level ${area.unlockConditions.minLevel} (current: ${level})`);
      }
    }

    if (area.unlockConditions.requiredItems && area.unlockConditions.requiredItems.length > 0) {
      const collectedItems = inventory.map(i => i.itemId);
      currentProgress.itemsCollected = collectedItems.filter(id => 
        area.unlockConditions!.requiredItems!.includes(id)
      );

      const missingItems = area.unlockConditions.requiredItems.filter(id => 
        !collectedItems.includes(id)
      );

      if (missingItems.length > 0) {
        missingConditions.push(`Missing items: ${missingItems.join(', ')}`);
      }
    }

    return {
      canUnlock: missingConditions.length === 0,
      missingConditions,
      currentProgress,
    };
  }

  async attemptUnlock(areaId: string): Promise<boolean> {
    const checkResult = await this.checkAreaUnlock(areaId);

    if (!checkResult.canUnlock) {
      return false;
    }

    const area = getAreaById(areaId);
    if (!area) return false;

    await databaseService.unlockArea(areaId);

    if (area.rewards) {
      await this.grantRewards(area.rewards);
    }

    return true;
  }

  private async grantRewards(rewards: AreaDefinition['rewards']): Promise<void> {
    if (!rewards) return;

    const profile = await databaseService.getUserProfile();
    if (!profile) return;

    const updates: Partial<UserProfile> = {
      coins: profile.coins + rewards.coins,
      totalCoinsEarned: profile.totalCoinsEarned + rewards.coins,
      experience: profile.experience + rewards.experience,
    };

    await databaseService.updateUserProfile(updates);
  }

  async getAllAreasProgress(): Promise<{ area: AreaDefinition; progress: UnlockCheckResult }[]> {
    const results: { area: AreaDefinition; progress: UnlockCheckResult }[] = [];

    for (const area of AREAS) {
      const progress = await this.checkAreaUnlock(area.id);
      results.push({ area, progress });
    }

    return results;
  }

  async getUnlockedAreas(): Promise<AreaDefinition[]> {
    const visited = await databaseService.getVisitedAreas();
    const unlockedIds = visited.filter(v => v.isUnlocked).map(v => v.areaId);

    return AREAS.filter(area => unlockedIds.includes(area.id));
  }

  async getLockedAreas(): Promise<AreaDefinition[]> {
    const visited = await databaseService.getVisitedAreas();
    const unlockedIds = visited.filter(v => v.isUnlocked).map(v => v.areaId);

    return AREAS.filter(area => !unlockedIds.includes(area.id));
  }

  async getClosestUnlockedArea(latitude: number, longitude: number): Promise<AreaDefinition | null> {
    const unlocked = await this.getUnlockedAreas();

    if (unlocked.length === 0) return null;

    let closest: AreaDefinition | null = null;
    let minDistance = Infinity;

    for (const area of unlocked) {
      const distance = this.calculateDistance(latitude, longitude, area.latitude, area.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        closest = area;
      }
    }

    return closest;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const areaUnlockEngine = new AreaUnlockEngine();