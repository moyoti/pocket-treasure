/**
 * P2P Treasure Hunt - Core Types
 * 
 * All types needed for the decentralized, serverless game system.
 */

// ============================================
// IDENTITY TYPES
// ============================================

export interface LocalIdentity {
  publicKey: string;           // Ed25519 public key (hex)
  displayName: string;
  createdAt: number;           // Unix timestamp
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

// ============================================
// ITEM TYPES (Built-in definitions)
// ============================================

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'collectible' | 'consumable' | 'cosmetic';

export interface ItemDefinition {
  id: string;                  // Unique item ID (hash of name)
  name: string;
  nameZh?: string;             // Chinese name (optional)
  description: string;
  rarity: ItemRarity;
  type: ItemType;
  spawnWeight: number;         // Relative weight for spawning
  maxStack: number;            // Maximum quantity per stack
  iconUrl?: string;            // Icon asset path
}

// ============================================
// POI TYPES (from OpenStreetMap)
// ============================================

export type PoiType = 
  | 'landmark' 
  | 'park' 
  | 'museum' 
  | 'temple' 
  | 'shopping' 
  | 'entertainment' 
  | 'business' 
  | 'tourism'
  | 'nature'
  | 'other';

export interface POI {
  id: string;                  // OSM element ID (e.g., "node/12345")
  name: string;
  latitude: number;
  longitude: number;
  poiType: PoiType;
  spawnWeight: number;         // Relative spawn weight for this POI
  osmType: 'node' | 'way' | 'relation';
  tags?: Record<string, string>; // Raw OSM tags
  cachedAt: number;            // When this was cached locally
}

// ============================================
// SPAWN TYPES (Deterministic generation)
// ============================================

export interface SpawnedTreasure {
  poiId: string;
  itemId: string;
  timeSlot: number;            // Math.floor(now / (4 * 3600 * 1000))
  expiresAt: number;           // timeSlot end time
  isCollected: boolean;        // Whether current player has collected
}

export interface CollectSignature {
  publicKey: string;           // Player's public key
  itemId: string;              // Item definition ID
  poiId: string;               // POI ID
  timeSlot: number;            // Time slot when collected
  timestamp: number;           // Exact collection time
  signature: string;           // Ed25519 signature (hex)
}

// ============================================
// INVENTORY TYPES (with ownership chain)
// ============================================

export interface InventoryItem {
  id: string;                  // Instance ID = hash(sourceSignature)
  itemId: string;              // Item definition ID
  quantity: number;
  sourceSignature: string;     // Original collection/trade signature
  sourcePoiId?: string;        // POI where collected (null if traded)
  collectedAt: number;         // Unix timestamp
  parentId?: string;           // Parent item ID if acquired via trade
  isLocked: boolean;           // Locked during active trade
}

// ============================================
// COLLECTED SLOTS (Prevent duplicate collection)
// ============================================

export interface CollectedSlot {
  poiId: string;
  timeSlot: number;
  collectedAt: number;
}

// ============================================
// USER PROFILE (Local player state)
// ============================================

export interface UserProfile {
  displayName: string;
  coins: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  experience: number;
  level: number;
  loginStreak: number;
  lastLoginDate: number | null;
  luckyPoints: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// SHOP TYPES
// ============================================

export interface ShopItemDefinition {
  id: string;
  name: string;
  nameZh?: string;
  description: string;
  category: string;
  price: number;
  rewards: {
    coins?: number;
    experience?: number;
    chestType?: string;
    itemId?: string;
    itemQuantity?: number;
  };
  isAvailable: boolean;
  purchaseLimit: number;
  iconUrl?: string;
  metadata?: Record<string, any>;
}

export interface PurchaseRecord {
  id: string;
  shopItemId: string;
  quantity: number;
  coinsSpent: number;
  purchasedAt: number;
}

// ============================================
// GACHA TYPES
// ============================================

export interface GachaPoolDefinition {
  id: string;
  name: string;
  nameZh?: string;
  description: string;
  singlePrice: number;
  tenPrice: number;
  pityMinRarity: ItemRarity;
  pityThreshold: number;
  items: {
    rarity: ItemRarity;
    weight: number;
  }[];
  isActive: boolean;
}

export interface GachaRecord {
  id: string;
  poolId: string;
  pullType: 'single' | 'ten';
  currencyUsed: 'coins';
  coinsSpent: number;
  itemsReceived: {
    itemId: string;
    rarity: ItemRarity;
    isPity: boolean;
  }[];
  pulledAt: number;
}

export interface GachaPity {
  poolId: string;
  pityCount: number;
  lastPullAt: number;
}

// ============================================
// CHEST TYPES
// ============================================

export interface ChestDefinition {
  id: string;
  name: string;
  nameZh?: string;
  description: string;
  openCost: number;
  dropPool: {
    minRarity: ItemRarity;
    maxRarity: ItemRarity;
  };
  iconUrl?: string;
}

export interface UserChest {
  id: string;
  chestId: string;
  quantity: number;
  acquiredAt: number;
}

// ============================================
// COSMETIC TYPES
// ============================================

export type CosmeticType = 'avatar_frame' | 'badge' | 'map_skin' | 'sticker' | 'title' | 'profile_background';

export interface CosmeticDefinition {
  id: string;
  name: string;
  nameZh?: string;
  description: string;
  type: CosmeticType;
  rarity: ItemRarity;
  price: number;
  iconUrl?: string;
  isLimited: boolean;
  isActive: boolean;
}

export interface UserCosmetic {
  id: string;
  cosmeticId: string;
  cosmeticType: CosmeticType;
  isEquipped: boolean;
  equippedAt?: number;
  purchasedAt: number;
}

// ============================================
// DAILY TASK TYPES
// ============================================

export type TaskType = 'login' | 'collect' | 'visit_poi' | 'collect_rarity';
export type TaskStatus = 'in_progress' | 'completed' | 'claimed';

export interface DailyTaskDefinition {
  id: string;
  taskType: TaskType;
  targetProgress: number;
  rarityRequirement?: ItemRarity;
  rewards: {
    coins: number;
    experience: number;
    itemId?: string;
    itemQuantity?: number;
  };
  name: string;
  nameZh?: string;
  description: string;
}

export interface UserDailyTask {
  id: string;
  taskDefinitionId: string;
  taskDate: string;
  currentProgress: number;
  status: TaskStatus;
  completedAt: number | null;
  claimedAt: number | null;
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export type AchievementType = 'collection' | 'rarity' | 'distance' | 'streak' | 'special';
export type AchievementStatus = 'in_progress' | 'completed' | 'claimed';

export interface AchievementDefinition {
  id: string;
  name: string;
  nameZh?: string;
  description: string;
  icon: string;
  type: AchievementType;
  requirement: number;
  tier: number;
  rarityRequirement?: ItemRarity;
  rewards: {
    coins: number;
    experience: number;
    title?: string;
  };
  isHidden: boolean;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  progress: number;
  status: AchievementStatus;
  completedAt: number | null;
  claimedAt: number | null;
}

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  identity: LocalIdentity | null;
  profile: UserProfile | null;
  inventory: InventoryItem[];
  collectedSlots: CollectedSlot[];
  nearbyPOIs: POI[];
  nearbySpawns: SpawnedTreasure[];
  userCosmetics: UserCosmetic[];
  userChests: UserChest[];
  dailyTasks: UserDailyTask[];
  achievements: UserAchievement[];
  gachaPity: GachaPity[];
}

// ============================================
// CONSTANTS
// ============================================

export const COLLECTION_RADIUS_METERS = 50;
export const SPAWN_INTERVAL_HOURS = 4;      // New spawn every 4 hours
export const EXPIRATION_HOURS = 24;
export const TIME_SLOT_DURATION_MS = 4 * 3600 * 1000; // 4 hours in ms

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

export const RARITY_BG: Record<ItemRarity, string> = {
  common: '#F3F4F6',
  rare: '#EBF5FF',
  epic: '#F5F0FF',
  legendary: '#FFFBEB',
};

export const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 70,
  rare: 20,
  epic: 8,
  legendary: 2,
};

export const POI_TYPE_WEIGHTS: Record<PoiType, number> = {
  landmark: 3.0,
  tourism: 2.5,
  park: 2.0,
  museum: 2.0,
  temple: 1.5,
  shopping: 1.5,
  entertainment: 1.5,
  nature: 1.5,
  business: 1.0,
  other: 1.0,
};