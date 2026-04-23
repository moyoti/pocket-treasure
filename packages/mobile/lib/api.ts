import { ItemRarity } from '@/types';

export type CosmeticType = 'avatar_frame' | 'badge' | 'map_skin' | 'sticker' | 'title' | 'profile_background';

export interface CosmeticDefinition {
  id: string;
  name: string;
  description: string;
  type: CosmeticType;
  rarity: ItemRarity;
  price: number;
  iconUrl?: string;
  isLimited: boolean;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface UserCosmetic {
  id: string;
  userId: string;
  cosmeticId: string;
  cosmeticType: CosmeticType;
  isEquipped: boolean;
  equippedAt?: string;
  purchasedAt: string;
  definition: CosmeticDefinition;
}

export async function getGachaPools() {
  return { pools: [] };
}

export async function pullGacha(_data: { poolId: string; pullType?: 'single' | 'ten'; currency?: 'coins' | 'gems' }) {
  return {
    success: true,
    pool: { id: 'default', name: 'Default Pool' },
    pullType: 'single' as const,
    results: [],
    coinsSpent: 0,
    gemsSpent: 0,
    newCoinBalance: 0,
    newGemBalance: 0,
    newPityCount: 0,
    currencyUsed: 'coins' as const,
  };
}

export async function getCoinBalance() {
  return { balance: 0 };
}

export async function getGemBalance() {
  return { balance: 0, totalEarned: 0, totalSpent: 0 };
}

export async function getUserAchievements() {
  return [];
}

export async function claimAchievementReward(_achievementId: string) {
  return { success: false, rewards: { coins: 0, experience: 0 }, newCoins: 0, newExperience: 0, newLevel: 1 };
}

export async function getDailyTasks() {
  return { tasks: [], stats: { todayCompleted: 0, todayTotal: 0, todayClaimed: 0 } };
}

export async function claimTaskReward(_taskId: string) {
  return { success: false, message: 'Not implemented', rewards: { coins: 0, experience: 0 }, task: null as any };
}

export async function refreshDailyTasks() {
  return { tasks: [], stats: { todayCompleted: 0, todayTotal: 0, todayClaimed: 0 } };
}

export async function getDailyTaskStats() {
  return { todayCompleted: 0, todayTotal: 0, todayClaimed: 0 };
}

export async function getUserStats() {
  return { totalItems: 0, uniqueItems: 0, byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 } };
}

export async function getAllCosmetics(): Promise<CosmeticDefinition[]> {
  return [];
}

export async function getUserCosmetics() {
  return { owned: [] as UserCosmetic[], equipped: [] as UserCosmetic[] };
}

export async function purchaseCosmetic(_cosmeticId: string) {
  return { success: false, userCosmetic: null as any, newGemsBalance: 0 };
}

export async function equipCosmetic(_cosmeticId: string) {
  return { success: false, equippedCosmetic: null as any };
}

export async function unequipCosmetic(_cosmeticType: CosmeticType) {
  return { success: false };
}

export async function getShopItems() {
  return [];
}

export async function purchaseShopItem(_data: { shopItemId: string; quantity: number }) {
  return { success: false, coinsSpent: 0, newBalance: 0, itemsReceived: [] };
}