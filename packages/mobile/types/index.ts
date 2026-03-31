export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'collectible' | 'consumable' | 'cosmetic';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
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

// Friends types
export interface Friend {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requester: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SearchResult {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

// Chat types
export interface Conversation {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// Trade types
export interface TradeItem {
  itemId: string;
  itemName: string;
  itemRarity: string;
  quantity: number;
}

export interface Trade {
  id: string;
  initiatorId: string;
  initiator: {
    id: string;
    username: string;
    avatar?: string;
  };
  receiverId: string;
  receiver: {
    id: string;
    username: string;
    avatar?: string;
  };
  initiatorItems: TradeItem[];
  receiverItems: TradeItem[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
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

// User Stats types
export interface UserStats {
  coins: number;
  experience: number;
  level: number;
  loginStreak: number;
  collectionCount: number;
}

// ==================== Economy Types ====================

export interface CoinBalance {
  balance: number;
  totalEarned?: number;
  totalSpent?: number;
}

export interface CoinStats {
  todayEarned: number;
  todaySpent: number;
  totalTransactions: number;
}

export interface SellItemResponse {
  success: boolean;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  previousBalance?: number;
  newBalance: number;
}

// ==================== Shop Types ====================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rewards: {
    coins?: number;
    experience?: number;
    chestType?: string;
    [key: string]: any;
  };
  isAvailable: boolean;
  availableFrom?: string;
  availableUntil?: string;
  purchaseLimit: number;
  iconUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
  singlePrice: number;
  tenPrice: number;
  gemPrice: number;
  tenGemPrice: number;
  pityMinRarity: ItemRarity;
  pityThreshold: number;
  items: {
    rarity: ItemRarity;
    weight: number;
  }[];
  isPremium: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GachaPullResponse {
  success: boolean;
  pool: {
    id: string;
    name: string;
  };
  pullType: 'single' | 'ten';
  results: {
    item: {
      id: string;
      name: string;
      rarity: ItemRarity;
      description: string;
    };
    rarity: ItemRarity;
    isPity: boolean;
  }[];
  coinsSpent: number;
  gemsSpent: number;
  newCoinBalance: number;
  newGemBalance: number;
  newPityCount: number;
  currencyUsed: 'coins' | 'gems';
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