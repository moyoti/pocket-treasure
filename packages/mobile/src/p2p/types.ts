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

// ============================================
// TRADE TYPES (BLE Local Trading)
// ============================================

export type TradeStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

export interface TradeRecord {
  id: string;
  partnerPublicKey: string;
  partnerDisplayName?: string;
  itemsGiven: string[];           // Inventory item IDs given
  itemsReceived: string[];        // Inventory item IDs received
  mySignature: string;            // Ed25519 signature (hex)
  partnerSignature?: string;      // Partner's signature (hex)
  tradeStatus: TradeStatus;
  tradedAt: number;
}

export interface TradeOffer {
  offerId: string;
  offererPublicKey: string;
  offererDisplayName: string;
  offeredItems: {
    inventoryId: string;
    itemId: string;
    quantity: number;
  }[];
  requestedItems?: {
    itemId: string;
    quantity: number;
  }[];
  createdAt: number;
  expiresAt: number;
}

export interface TradeSession {
  sessionId: string;
  partnerPublicKey: string;
  partnerDisplayName: string;
  myOffer?: TradeOffer;
  partnerOffer?: TradeOffer;
  status: 'discovering' | 'connecting' | 'negotiating' | 'exchanging' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
}

export interface NearbyTrader {
  publicKey: string;
  displayName: string;
  deviceId: string;
}

// ============================================
// AREA EXPLORATION TYPES (Geofencing)
// ============================================

export interface AreaDefinition {
  id: string;
  name: string;
  nameZh?: string;
  latitude: number;
  longitude: number;
  radius: number;                 // meters
  unlockConditions?: {
    minVisitCount?: number;
    requiredItems?: string[];
    minLevel?: number;
  };
  rewards?: {
    coins: number;
    experience: number;
    title?: string;
  };
}

export interface VisitedArea {
  id: string;
  areaId: string;
  areaName: string;
  areaNameZh?: string;
  latitude: number;
  longitude: number;
  radius: number;
  firstVisitAt: number;
  lastVisitAt: number;
  visitCount: number;
  isUnlocked: boolean;
  unlockConditions?: string;      // JSON stringified
}

// ============================================
// COLLECTION SERIES TYPES
// ============================================

export type SeriesCategory = 'themed' | 'rarity' | 'location' | 'seasonal' | 'special';

export interface SeriesDefinition {
  id: string;
  name: string;
  nameZh?: string;
  category: SeriesCategory;
  requiredItems: string[];        // Item definition IDs
  rewards: {
    milestone25?: { coins: number; experience: number; };
    milestone50?: { coins: number; experience: number; itemId?: string; };
    milestone75?: { coins: number; experience: number; itemId?: string; };
    completion: { coins: number; experience: number; title?: string; itemId?: string; };
  };
  isHidden?: boolean;
}

export interface SeriesProgress {
  id: string;
  seriesId: string;
  seriesName: string;
  seriesNameZh?: string;
  category: SeriesCategory;
  requiredItems: string[];
  collectedItems: string[];
  progressPercent: number;
  milestone25: boolean;
  milestone50: boolean;
  milestone75: boolean;
  isCompleted: boolean;
  completedAt?: number;
  rewardsClaimed: string[];       // Array of claimed milestone IDs
}

// ============================================
// CUSTOM MARKER TYPES
// ============================================

export type MarkerIconType = 'star' | 'flag' | 'treasure' | 'camp' | 'note' | 'camera' | 'heart' | 'pin';

export interface UserMarker {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  iconType: MarkerIconType;
  color: string;
  creatorPublicKey: string;
  isShared: boolean;              // Whether shared via BLE
  createdAt: number;
  updatedAt: number;
}

export interface SharedMarker extends UserMarker {
  receivedFrom: string;           // Public key of sharer
  receivedAt: number;
}

// ============================================
// BLE SERVICE CONSTANTS
// ============================================

export const BLE_SERVICE_UUID = 'treasure-hunt-trade-v1';
export const BLE_CHARACTERISTIC_OFFER = 'offer-data';
export const BLE_CHARACTERISTIC_RESPONSE = 'response-data';
export const BLE_CHARACTERISTIC_SIGNATURE = 'signature-data';
export const BLE_SCAN_TIMEOUT_MS = 30000;        // 30 seconds
export const BLE_CONNECTION_TIMEOUT_MS = 30000;  // 30 seconds
export const BLE_MAX_RANGE_METERS = 10;         // ~10m BLE range