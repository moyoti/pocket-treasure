import { db } from './schema';
import {
  ItemDefinition,
  POI,
  InventoryItem,
  CollectedSlot,
  ItemRarity,
  UserProfile,
  ShopItemDefinition,
  PurchaseRecord,
  GachaPoolDefinition,
  GachaRecord,
  GachaPity,
  ChestDefinition,
  UserChest,
  CosmeticDefinition,
  CosmeticType,
  UserCosmetic,
  DailyTaskDefinition,
  UserDailyTask,
  AchievementDefinition,
  UserAchievement,
  TradeRecord,
  VisitedArea,
  UserMarker,
  SeriesProgress,
  SeriesCategory,
} from '../types';

export const databaseService = {
  async initialize(): Promise<void> {
    await db.open();
  },

  async close(): Promise<void> {
    db.close();
  },

  async clearAllData(): Promise<void> {
    await Promise.all([
      db.inventory.clear(),
      db.collectedSlots.clear(),
      db.poiCache.clear(),
      db.purchaseRecords.clear(),
      db.gachaRecords.clear(),
      db.userChests.clear(),
      db.userCosmetics.clear(),
      db.userDailyTasks.clear(),
      db.userAchievements.clear(),
      db.gachaPity.clear(),
      db.visitedAreas.clear(),
      db.userMarkers.clear(),
      db.tradeHistory.clear(),
      db.seriesProgress.clear(),
    ]);
  },

  async seedItemDefinitions(items: ItemDefinition[]): Promise<void> {
    await db.itemDefinitions.bulkPut(items);
  },

  async getAllItemDefinitions(): Promise<ItemDefinition[]> {
    return db.itemDefinitions.orderBy('rarity').toArray();
  },

  async getItemsByRarity(rarity: ItemRarity): Promise<ItemDefinition[]> {
    return db.itemDefinitions.where('rarity').equals(rarity).toArray();
  },

  async getItemById(id: string): Promise<ItemDefinition | undefined> {
    return db.itemDefinitions.get(id);
  },

  async getInventory(): Promise<InventoryItem[]> {
    return db.inventory.filter(item => !item.isLocked).reverse().sortBy('collectedAt');
  },

  async getInventoryByItem(itemId: string): Promise<InventoryItem[]> {
    return db.inventory.where('itemId').equals(itemId).filter(item => !item.isLocked).toArray();
  },

  async addInventoryItem(item: InventoryItem): Promise<void> {
    await db.inventory.put(item);
  },

  async removeInventoryItem(id: string): Promise<void> {
    await db.inventory.delete(id);
  },

  async updateInventoryQuantity(id: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeInventoryItem(id);
    } else {
      await db.inventory.update(id, { quantity });
    }
  },

  async setItemLocked(id: string, locked: boolean): Promise<void> {
    await db.inventory.update(id, { isLocked: locked });
  },

  async getCollectedSlots(): Promise<CollectedSlot[]> {
    return db.collectedSlots.toArray();
  },

  async addCollectedSlot(slot: CollectedSlot): Promise<void> {
    await db.collectedSlots.put(slot);
  },

  async hasCollectedSlot(poiId: string, timeSlot: number): Promise<boolean> {
    const slot = await db.collectedSlots.get([poiId, timeSlot]);
    return !!slot;
  },

  async cachePOI(poi: POI): Promise<void> {
    const expiresAt = Date.now() + 7 * 24 * 3600 * 1000;
    await db.poiCache.put({ ...poi, expiresAt });
  },

  async cachePOIs(pois: POI[]): Promise<void> {
    const expiresAt = Date.now() + 7 * 24 * 3600 * 1000;
    await db.poiCache.bulkPut(pois.map(p => ({ ...p, expiresAt })));
  },

  async getPOIsNearby(latitude: number, longitude: number, radiusKm: number): Promise<POI[]> {
    const latRange = radiusKm / 111.32;
    const lngRange = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
    const now = Date.now();

    const all = await db.poiCache.toArray();
    return all.filter(poi => 
      poi.expiresAt > now &&
      Math.abs(poi.latitude - latitude) <= latRange &&
      Math.abs(poi.longitude - longitude) <= lngRange
    );
  },

  async getPOIById(id: string): Promise<POI | undefined> {
    return db.poiCache.get(id);
  },

  async getItemCount(): Promise<number> {
    return db.inventory.count();
  },

  async getInventoryStats(): Promise<{ total: number; byRarity: Record<ItemRarity, number> }> {
    const items = await db.inventory.toArray();
    const definitions = await db.itemDefinitions.toArray();
    const defMap = new Map(definitions.map(d => [d.id, d]));
    
    const byRarity: Record<ItemRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    for (const item of items) {
      const def = defMap.get(item.itemId);
      if (def) {
        byRarity[def.rarity]++;
      }
    }

    return { total: items.length, byRarity };
  },

  async getUserProfile(): Promise<UserProfile | undefined> {
    return db.userProfile.get(1);
  },

  async initUserProfile(): Promise<UserProfile> {
    const existing = await this.getUserProfile();
    if (existing) return existing;

    const now = Date.now();
    const profile: UserProfile & { id: number } = {
      id: 1,
      displayName: 'Explorer',
      coins: 1000,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      experience: 0,
      level: 1,
      loginStreak: 0,
      lastLoginDate: null,
      luckyPoints: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.userProfile.put(profile);
    return profile;
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    const now = Date.now();
    await db.userProfile.update(1, { ...updates, updatedAt: now });
  },

  async addCoins(amount: number): Promise<number> {
    const profile = await this.getUserProfile();
    if (!profile) return 0;
    
    const newCoins = profile.coins + amount;
    await db.userProfile.update(1, {
      coins: newCoins,
      totalCoinsEarned: profile.totalCoinsEarned + (amount > 0 ? amount : 0),
      updatedAt: Date.now(),
    });
    return newCoins;
  },

  async spendCoins(amount: number): Promise<boolean> {
    const profile = await this.getUserProfile();
    if (!profile || profile.coins < amount) return false;

    await db.userProfile.update(1, {
      coins: profile.coins - amount,
      totalCoinsSpent: profile.totalCoinsSpent + amount,
      updatedAt: Date.now(),
    });
    return true;
  },

  async seedShopItems(items: ShopItemDefinition[]): Promise<void> {
    await db.shopItems.bulkPut(items);
  },

  async getShopItems(): Promise<ShopItemDefinition[]> {
    const all = await db.shopItems.toArray();
    return all.filter(item => item.isAvailable).sort((a, b) => a.price - b.price);
  },

  async addPurchaseRecord(record: PurchaseRecord): Promise<void> {
    await db.purchaseRecords.put(record);
  },

  async seedGachaPools(pools: GachaPoolDefinition[]): Promise<void> {
    await db.gachaPools.bulkPut(pools);
  },

  async getGachaPools(): Promise<GachaPoolDefinition[]> {
    const all = await db.gachaPools.toArray();
    return all.filter(pool => pool.isActive);
  },

  async getGachaPity(poolId: string): Promise<GachaPity> {
    const pity = await db.gachaPity.get(poolId);
    return pity || { poolId, pityCount: 0, lastPullAt: Date.now() };
  },

  async updateGachaPity(poolId: string, pityCount: number): Promise<void> {
    await db.gachaPity.put({ poolId, pityCount, lastPullAt: Date.now() });
  },

  async addGachaRecord(record: GachaRecord): Promise<void> {
    await db.gachaRecords.put(record);
  },

  async seedChests(chests: ChestDefinition[]): Promise<void> {
    await db.chests.bulkPut(chests);
  },

  async getChests(): Promise<ChestDefinition[]> {
    return db.chests.toArray();
  },

  async getUserChests(): Promise<UserChest[]> {
    return db.userChests.toArray();
  },

  async addUserChest(chestId: string, quantity: number = 1): Promise<void> {
    const existing = (await db.userChests.toArray()).find(c => c.chestId === chestId);
    if (existing) {
      await db.userChests.update(existing.id, { quantity: existing.quantity + quantity });
    } else {
      await db.userChests.put({
        id: `${chestId}_${Date.now()}`,
        chestId,
        quantity,
        acquiredAt: Date.now(),
      });
    }
  },

  async removeUserChest(chestId: string, quantity: number = 1): Promise<boolean> {
    const existing = (await db.userChests.toArray()).find(c => c.chestId === chestId);
    if (!existing || existing.quantity < quantity) return false;

    if (existing.quantity <= quantity) {
      await db.userChests.delete(existing.id);
    } else {
      await db.userChests.update(existing.id, { quantity: existing.quantity - quantity });
    }
    return true;
  },

  async seedCosmetics(cosmetics: CosmeticDefinition[]): Promise<void> {
    await db.cosmetics.bulkPut(cosmetics);
  },

  async getCosmetics(): Promise<CosmeticDefinition[]> {
    const all = await db.cosmetics.toArray();
    return all.filter(c => c.isActive);
  },

  async getUserCosmetics(): Promise<UserCosmetic[]> {
    return db.userCosmetics.toArray();
  },

  async addUserCosmetic(cosmeticId: string, cosmeticType: CosmeticType): Promise<UserCosmetic> {
    const now = Date.now();
    const id = `${cosmeticId}_${now}`;
    const userCosmetic: UserCosmetic = {
      id,
      cosmeticId,
      cosmeticType,
      isEquipped: false,
      purchasedAt: now,
    };
    await db.userCosmetics.put(userCosmetic);
    return userCosmetic;
  },

  async equipCosmetic(cosmeticId: string): Promise<void> {
    const cosmetic = await db.cosmetics.get(cosmeticId);
    if (!cosmetic) return;

    const allUserCosmetics = await db.userCosmetics.toArray();
    for (const uc of allUserCosmetics) {
      if (uc.cosmeticType === cosmetic.type) {
        await db.userCosmetics.update(uc.id, { isEquipped: false });
      }
    }
    
    const targetUc = allUserCosmetics.find(uc => uc.cosmeticId === cosmeticId);
    if (targetUc) {
      await db.userCosmetics.update(targetUc.id, { isEquipped: true, equippedAt: Date.now() });
    }
  },

  async unequipCosmetic(cosmeticType: CosmeticType): Promise<void> {
    const allUserCosmetics = await db.userCosmetics.toArray();
    for (const uc of allUserCosmetics) {
      if (uc.cosmeticType === cosmeticType) {
        await db.userCosmetics.update(uc.id, { isEquipped: false });
      }
    }
  },

  async getEquippedCosmetics(): Promise<UserCosmetic[]> {
    const all = await db.userCosmetics.toArray();
    return all.filter(uc => uc.isEquipped);
  },

  async seedDailyTaskDefinitions(tasks: DailyTaskDefinition[]): Promise<void> {
    await db.dailyTaskDefinitions.bulkPut(tasks);
  },

  async getDailyTaskDefinitions(): Promise<DailyTaskDefinition[]> {
    return db.dailyTaskDefinitions.toArray();
  },

  async getUserDailyTasks(taskDate: string): Promise<UserDailyTask[]> {
    const all = await db.userDailyTasks.toArray();
    return all.filter(t => t.taskDate === taskDate);
  },

  async initDailyTasksForDate(taskDate: string): Promise<UserDailyTask[]> {
    const definitions = await this.getDailyTaskDefinitions();
    const tasks: UserDailyTask[] = [];

    for (const def of definitions) {
      const id = `${def.id}_${taskDate}`;
      const existing = await db.userDailyTasks.get(id);
      if (!existing) {
        const task: UserDailyTask = {
          id,
          taskDefinitionId: def.id,
          taskDate,
          currentProgress: 0,
          status: 'in_progress',
          completedAt: null,
          claimedAt: null,
        };
        await db.userDailyTasks.put(task);
        tasks.push(task);
      } else {
        tasks.push(existing);
      }
    }

    return tasks;
  },

  async updateDailyTaskProgress(taskDefinitionId: string, taskDate: string, progress: number): Promise<UserDailyTask | undefined> {
    const definition = await db.dailyTaskDefinitions.get(taskDefinitionId);
    if (!definition) return undefined;

    const id = `${taskDefinitionId}_${taskDate}`;
    const newStatus = progress >= definition.targetProgress ? 'completed' : 'in_progress';
    const completedAt = progress >= definition.targetProgress ? Date.now() : null;

    await db.userDailyTasks.update(id, { currentProgress: progress, status: newStatus, completedAt });
    return db.userDailyTasks.get(id);
  },

  async getUserDailyTask(taskDefinitionId: string, taskDate: string): Promise<UserDailyTask | undefined> {
    const id = `${taskDefinitionId}_${taskDate}`;
    return db.userDailyTasks.get(id);
  },

  async claimDailyTask(taskDefinitionId: string, taskDate: string): Promise<boolean> {
    const task = await this.getUserDailyTask(taskDefinitionId, taskDate);
    if (!task || task.status !== 'completed' || task.claimedAt) return false;

    const id = `${taskDefinitionId}_${taskDate}`;
    await db.userDailyTasks.update(id, { status: 'claimed', claimedAt: Date.now() });
    return true;
  },

  async seedAchievements(achievements: AchievementDefinition[]): Promise<void> {
    await db.achievements.bulkPut(achievements);
  },

  async getAchievements(): Promise<AchievementDefinition[]> {
    const all = await db.achievements.toArray();
    return all.filter(a => a.isActive).sort((a, b) => a.tier - b.tier);
  },

  async getUserAchievements(): Promise<UserAchievement[]> {
    return db.userAchievements.toArray();
  },

  async initUserAchievements(): Promise<void> {
    const achievements = await this.getAchievements();
    for (const ach of achievements) {
      const existing = await db.userAchievements.get(ach.id);
      if (!existing) {
        await db.userAchievements.put({
          id: ach.id,
          achievementId: ach.id,
          progress: 0,
          status: 'in_progress',
          completedAt: null,
          claimedAt: null,
        });
      }
    }
  },

  async updateAchievementProgress(achievementId: string, progress: number): Promise<UserAchievement | undefined> {
    const achievement = await db.achievements.get(achievementId);
    if (!achievement) return undefined;

    const newStatus = progress >= achievement.requirement ? 'completed' : 'in_progress';
    const completedAt = progress >= achievement.requirement ? Date.now() : null;

    await db.userAchievements.update(achievementId, { progress, status: newStatus, completedAt });
    return db.userAchievements.get(achievementId);
  },

  async getUserAchievement(achievementId: string): Promise<UserAchievement | undefined> {
    return db.userAchievements.get(achievementId);
  },

  async claimAchievement(achievementId: string): Promise<boolean> {
    const userAch = await this.getUserAchievement(achievementId);
    if (!userAch || userAch.status !== 'completed' || userAch.claimedAt) return false;

    await db.userAchievements.update(achievementId, { status: 'claimed', claimedAt: Date.now() });
    return true;
  },

  async getVisitedAreas(): Promise<VisitedArea[]> {
    const all = await db.visitedAreas.toArray();
    return all.sort((a, b) => b.lastVisitAt - a.lastVisitAt);
  },

  async addVisitedArea(area: VisitedArea): Promise<void> {
    await db.visitedAreas.put(area);
  },

  async updateAreaVisit(areaId: string): Promise<void> {
    const existing = (await db.visitedAreas.toArray()).find(a => a.areaId === areaId);
    if (existing) {
      await db.visitedAreas.update(existing.id, { 
        lastVisitAt: Date.now(), 
        visitCount: existing.visitCount + 1 
      });
    }
  },

  async unlockArea(areaId: string): Promise<void> {
    const existing = (await db.visitedAreas.toArray()).find(a => a.areaId === areaId);
    if (existing) {
      await db.visitedAreas.update(existing.id, { isUnlocked: true });
    }
  },

  async getUserMarkers(): Promise<UserMarker[]> {
    const all = await db.userMarkers.toArray();
    return all.sort((a, b) => b.createdAt - a.createdAt);
  },

  async addUserMarker(marker: UserMarker): Promise<void> {
    await db.userMarkers.put(marker);
  },

  async updateUserMarker(id: string, updates: Partial<UserMarker>): Promise<void> {
    await db.userMarkers.update(id, { ...updates, updatedAt: Date.now() });
  },

  async deleteUserMarker(id: string): Promise<void> {
    await db.userMarkers.delete(id);
  },

  async getTradeHistory(): Promise<TradeRecord[]> {
    const all = await db.tradeHistory.toArray();
    return all.sort((a, b) => b.tradedAt - a.tradedAt);
  },

  async addTradeRecord(record: TradeRecord): Promise<void> {
    await db.tradeHistory.put(record);
  },

  async getSeriesProgress(): Promise<SeriesProgress[]> {
    return db.seriesProgress.toArray();
  },

  async updateSeriesProgress(progress: SeriesProgress): Promise<void> {
    await db.seriesProgress.put(progress);
  },

  async initSeriesProgress(seriesData: { id: string; name: string; nameZh?: string; category: SeriesCategory; requiredItems: string[] }): Promise<void> {
    const existing = await db.seriesProgress.get(seriesData.id);
    if (!existing) {
      await db.seriesProgress.put({
        id: seriesData.id,
        seriesId: seriesData.id,
        seriesName: seriesData.name,
        seriesNameZh: seriesData.nameZh,
        category: seriesData.category,
        requiredItems: seriesData.requiredItems,
        collectedItems: [],
        progressPercent: 0,
        milestone25: false,
        milestone50: false,
        milestone75: false,
        isCompleted: false,
        completedAt: null,
        rewardsClaimed: [],
      });
    }
  },

  async getSeriesProgressById(seriesId: string): Promise<SeriesProgress | undefined> {
    return db.seriesProgress.get(seriesId);
  },

  async claimSeriesReward(seriesId: string, milestone: string): Promise<boolean> {
    const progress = await db.seriesProgress.get(seriesId);
    if (!progress) return false;
    const rewardsClaimed = [...(progress.rewardsClaimed || []), milestone];
    await db.seriesProgress.update(seriesId, { rewardsClaimed });
    return true;
  },
};
