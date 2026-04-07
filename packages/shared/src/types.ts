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

// ============================================
// GEM TYPES (Premium Currency)
// ============================================

export enum GemTransactionType {
  EARN = 'earn',
  SPEND = 'spend',
}

export enum GemTransactionSource {
  RECHARGE = 'recharge',
  GACHA = 'gacha',
  SHOP_PURCHASE = 'shop_purchase',
  REFUND = 'refund',
  ACHIEVEMENT = 'achievement',
  ADMIN = 'admin',
}

export interface GemBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface GemTransaction {
  id: string;
  userId: string;
  type: GemTransactionType;
  source: GemTransactionSource;
  amount: number;
  description?: string;
  createdAt: Date;
}

// ============================================
// RECHARGE TYPES
// ============================================

export enum RechargeStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface RechargePackage {
  id: string;
  name: string;
  price: number;
  gemsAmount: number;
  bonusGems: number;
  isFirstRechargeBonus: boolean;
  iconUrl?: string;
  sortOrder: number;
  isActive?: boolean;
}

export interface RechargeRecord {
  id: string;
  userId: string;
  packageId: string;
  orderId: string;
  amount: number;
  gemsAwarded: number;
  status: RechargeStatus;
  paymentChannel?: string;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateOrderRequest {
  packageId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  status: string;
}

export interface RechargeCallbackDto {
  orderId: string;
  transactionId?: string;
  status: 'completed' | 'failed';
}

// ============ In-App Purchase Types ============

// 支付渠道枚举
export enum PaymentChannel {
  WECHAT = 'wechat',
  GOOGLE_PLAY = 'google_play',
  APPLE_IAP = 'apple_iap',
}

// IAP 产品类型
export enum IAPProductType {
  CONSUMABLE = 'consumable',
  NON_CONSUMABLE = 'non_consumable',
  AUTO_RENEWABLE_SUBSCRIPTION = 'auto_renewable_subscription',
}

// 订阅状态
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  GRACE_PERIOD = 'grace_period',
  REVOKED = 'revoked',
}

// IAP 购买结果 (移动端 -> 服务端)
export interface IAPPurchaseResult {
  orderId: string;
  productId: string;
  transactionId: string;
  purchaseToken?: string;           // Google Play
  originalTransactionId?: string;   // Apple
  transactionReceipt?: string;      // Apple receipt (base64)
  purchaseDate: string;
  expirationDate?: string;
  autoRenewing?: boolean;
  environment?: 'PRODUCTION' | 'SANDBOX';
}

// Google Play 购买验证结果
export interface GooglePlayPurchase {
  purchaseState: 'PURCHASED' | 'REFUNDED' | 'CANCELLED';
  consumptionState: 'CONSUMED' | 'NOT_CONSUMED';
  orderId: string;
  purchaseTime: string;
  purchaseToken: string;
  acknowledged: boolean;
}

// Apple 购买验证结果
export interface ApplePurchaseResult {
  receipt: AppleReceipt;
  status: number;
}

export interface AppleReceipt {
  receipt_type: string;
  app_id: string;
  bundle_id: string;
  application_version: string;
  receipt_creation_date: string;
  receipt_creation_date_ms: string;
  in_app: AppleInAppPurchase[];
}

export interface AppleInAppPurchase {
  quantity: number;
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date: string;
  purchase_date_ms: string;
  expiration_date?: string;
  expiration_date_ms?: string;
  auto_renewing: boolean;
  is_refund?: boolean;
}

// 订阅信息
export interface SubscriptionInfo {
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenewing: boolean;
  isTrial: boolean;
}

// 订阅权益配置
export interface SubscriptionBenefit {
  dailyBonusGems: number;        // 每日奖励宝石数
  exclusiveItems: string[];      // 专属物品ID列表
  gachaDiscountPercent: number;  // gacha 折扣 %
  maxGachaPerDay: number;        // 每日最大gacha次数
}

// 订阅等级配置
export interface SubscriptionTier {
  id: string;
  name: string;
  productId: string;             // Store 产品ID
  benefits: SubscriptionBenefit;
  price: number;                 // 价格(分)
}