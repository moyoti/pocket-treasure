export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'collectible' | 'consumable' | 'cosmetic';

// POI Types
export type PoiType = 'landmark' | 'park' | 'museum' | 'temple' | 'shopping' | 'entertainment' | 'business' | 'other';

export interface PoiBonusRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
  coins?: number;
  experience?: number;
  level?: number;
  loginStreak?: number;
  luckyPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  type: ItemType;
  spawnWeight: number;
  maxStack: number;
  iconUrl?: string;
  modelUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SpawnedItem {
  id: string;
  latitude: number;
  longitude: number;
  itemId: string;
  itemName: string;
  itemRarity: ItemRarity;
  itemIconUrl?: string;
  poiName?: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  collectedLatitude: number;
  collectedLongitude: number;
  poiName?: string;
  collectedAt: string;
  item: Item;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  collectionCount: number;
  rareItems?: number;
  epicItems?: number;
  legendaryItems?: number;
}

// Achievement types
export type AchievementType = 'collection' | 'rarity' | 'distance' | 'streak' | 'special';
export type AchievementStatus = 'in_progress' | 'completed' | 'claimed';

export interface AchievementRewards {
  coins: number;
  experience: number;
  itemId?: string;
  itemQuantity?: number;
  title?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  requirement: number;
  tier: number;
  rewards?: AchievementRewards;
  rarityRequirement?: string;
  isHidden?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  achievement: Achievement;
  progress: number;
  status: AchievementStatus;
  completedAt: Date | null;
  claimedAt: Date | null;
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  requirement: number;
  status: AchievementStatus;
  completedAt: Date | null;
  claimedAt: Date | null;
  canClaim: boolean;
}

export interface ClaimRewardResponse {
  success: boolean;
  rewards: AchievementRewards;
  newCoins: number;
  newExperience: number;
  newLevel: number;
}

export interface UserStats {
  coins: number;
  experience: number;
  level: number;
  loginStreak: number;
  collectionCount: number;
}

// Daily Task types
export type TaskType = 'login' | 'collect' | 'visit_poi' | 'collect_rarity';
export type TaskStatus = 'in_progress' | 'completed' | 'claimed';

export interface TaskRewards {
  coins: number;
  experience: number;
  itemId?: string;
  itemQuantity?: number;
}

export interface DailyTask {
  id: string;
  userId: string;
  taskType: TaskType;
  taskDate: string;
  currentProgress: number;
  targetProgress: number;
  status: TaskStatus;
  rewards: TaskRewards;
  rarityRequirement?: string;
  completedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
}

export interface DailyTaskStats {
  todayCompleted: number;
  todayTotal: number;
  todayClaimed: number;
}

export interface DailyTasksResponse {
  tasks: DailyTask[];
  stats: DailyTaskStats;
}

export interface ClaimTaskResponse {
  success: boolean;
  message: string;
  rewards: TaskRewards;
  task: DailyTask;
}

// ==================== Economy Types ====================

export interface CoinBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinStats {
  todayEarned: number;
  todaySpent: number;
  totalTransactions: number;
}

export interface SellItemRequest {
  inventoryItemId: string;
  quantity: number;
}

export interface SellItemResponse {
  success: boolean;
  coinsEarned: number;
  newBalance: number;
}

// ==================== Shop Types ====================

export interface ShopItem {
  id: string;
  itemId: string;
  item: Item;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface PurchaseRequest {
  shopItemId: string;
  quantity: number;
}

export interface PurchaseResponse {
  success: boolean;
  coinsSpent: number;
  newBalance: number;
  itemsReceived: {
    itemId: string;
    itemName: string;
    quantity: number;
  }[];
}

// ==================== Chest Types ====================

export interface ChestDefinition {
  id: string;
  name: string;
  description: string;
  openCost: number;
  imageUrl?: string;
  dropPool: {
    minRarity: ItemRarity;
    maxRarity: ItemRarity;
  };
}

export interface UserChest {
  id: string;
  chestId: string;
  chest: ChestDefinition;
  quantity: number;
}

export interface OpenChestRequest {
  chestId: string;
}

export interface OpenChestResponse {
  success: boolean;
  itemReceived: {
    itemId: string;
    itemName: string;
    itemRarity: ItemRarity;
    quantity: number;
  };
  coinsSpent: number;
}

// ==================== Gacha Types ====================

export interface GachaPool {
  id: string;
  name: string;
  description: string;
  singleCost: number;
  tenCost: number;
  guaranteeRarity: ItemRarity;
  guaranteeAt: number;
  items: {
    itemId: string;
    itemName: string;
    itemRarity: ItemRarity;
    weight: number;
  }[];
}

export interface GachaPullRequest {
  poolId: string;
  count: 1 | 10;
}

export interface GachaPullResponse {
  success: boolean;
  coinsSpent: number;
  newBalance: number;
  itemsReceived: {
    itemId: string;
    itemName: string;
    itemRarity: ItemRarity;
    quantity: number;
  }[];
  guaranteeProgress: number;
}

// ==================== Market Types ====================

export interface MarketListing {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    username: string;
    avatar?: string;
  };
  itemId: string;
  item: Item;
  quantity: number;
  price: number;
  fee: number;
  totalPrice: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

export interface CreateListingRequest {
  inventoryItemId: string;
  quantity: number;
  price: number;
}

export interface CreateListingResponse {
  success: boolean;
  listingId: string;
  fee: number;
}

export interface MarketListingsParams {
  rarity?: ItemRarity;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== Event Types ====================

export type EventBonusType = 'rarity' | 'quantity' | 'coins' | 'legendary_rate';

export interface GameEvent {
  id: string;
  name: string;
  description?: string;
  nameZh?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  bonusType: EventBonusType;
  bonusValue: number;
  specialItems?: string[];
  restrictedPoiTypes?: string[];
  bannerUrl?: string;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Spawn Types ====================

export interface TimeBonus {
  name: string;
  nameZh: string;
  rarityBonus: number;
  quantityMultiplier: number;
  legendaryMultiplier?: number;
}

export interface CurrentBonuses {
  timeBonus: TimeBonus;
  isWeekend: boolean;
  activeEvents: number;
}