import { ItemRarity } from './types';

// Collection radius in meters
export const COLLECTION_RADIUS_METERS = 50;

// Item spawn interval in hours
export const SPAWN_INTERVAL_HOURS = 1;

// Item expiration in hours
export const ITEM_EXPIRATION_HOURS = 24;

// Default map zoom level
export const DEFAULT_MAP_ZOOM = 15;

// Rarity colors
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

// Rarity names in Chinese
export const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

// Fixed rarity weights for spawning (percentage)
export const FIXED_RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 70,    // 70%
  rare: 20,      // 20%
  epic: 8,       // 8%
  legendary: 2,  // 2%
};

// Legacy rarity weights (for backwards compatibility with item.spawnWeight)
export const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 1,
  rare: 0.5,
  epic: 0.2,
  legendary: 0.05,
};

// POI type spawn weights
export const POI_TYPE_WEIGHTS: Record<string, number> = {
  landmark: 3.0,       // 地标建筑，最多宝藏
  park: 2.0,           // 公园绿地
  museum: 2.0,         // 博物馆/文化场所
  temple: 1.5,         // 寺庙/宗教场所
  shopping: 1.5,       // 商业区
  entertainment: 1.5,  // 娱乐场所
  business: 1.0,       // 商务区
  other: 1.0,          // 其他
};

// Time bonus configuration
export interface TimeBonusConfig {
  startHour: number;
  endHour: number;
  name: string;
  nameZh: string;
  rarityBonus: number;  // Percentage bonus to rarity
  quantityMultiplier: number;
  legendaryMultiplier?: number;  // Multiplier for legendary rate
}

export const TIME_BONUS_CONFIGS: TimeBonusConfig[] = [
  { startHour: 6, endHour: 9, name: 'morning', nameZh: '早间加成', rarityBonus: 5, quantityMultiplier: 1 },
  { startHour: 12, endHour: 14, name: 'lunch', nameZh: '午间加成', rarityBonus: 0, quantityMultiplier: 1.5 },
  { startHour: 18, endHour: 21, name: 'golden', nameZh: '黄金时段', rarityBonus: 10, quantityMultiplier: 1 },
  { startHour: 21, endHour: 24, name: 'night', nameZh: '夜间加成', rarityBonus: 0, quantityMultiplier: 1, legendaryMultiplier: 2 },
];

// Weekend bonus
export const WEEKEND_BONUS = {
  rarityBonus: 5,
  quantityMultiplier: 2,
};

// Lucky value configuration
export const LUCKY_VALUE_CONFIG = {
  maxLuckyValue: 50,  // Maximum 50% bonus
  streakBonuses: [
    { days: 3, bonus: 5 },
    { days: 7, bonus: 10 },
    { days: 14, bonus: 15 },
    { days: 30, bonus: 25 },
  ],
  rarityBonusPerPoint: 0.5,  // Each 1% lucky value = +0.5% to rarity weights
};

// Spawn configuration
export const SPAWN_CONFIG = {
  scheduledIntervalHours: 4,  // Every 4 hours
  baseItemsPerPoi: 3,
  userTriggeredMaxItems: 5,
  userTriggeredRadiusKm: 2,
  minNearbyItemsThreshold: 10,  // Trigger user spawn if fewer than this
};