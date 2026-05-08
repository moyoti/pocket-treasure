import Dexie, { Table } from 'dexie';
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
} from '../types';

export class TreasureHuntDB extends Dexie {
  itemDefinitions!: Table<ItemDefinition, string>;
  poiCache!: Table<POI & { expiresAt: number }, string>;
  inventory!: Table<InventoryItem, string>;
  collectedSlots!: Table<CollectedSlot, [string, number]>;
  userProfile!: Table<UserProfile & { id: number }, number>;
  shopItems!: Table<ShopItemDefinition, string>;
  purchaseRecords!: Table<PurchaseRecord, string>;
  gachaPools!: Table<GachaPoolDefinition, string>;
  gachaRecords!: Table<GachaRecord, string>;
  gachaPity!: Table<GachaPity, string>;
  chests!: Table<ChestDefinition, string>;
  userChests!: Table<UserChest, string>;
  cosmetics!: Table<CosmeticDefinition, string>;
  userCosmetics!: Table<UserCosmetic, string>;
  dailyTaskDefinitions!: Table<DailyTaskDefinition, string>;
  userDailyTasks!: Table<UserDailyTask, string>;
  achievements!: Table<AchievementDefinition, string>;
  userAchievements!: Table<UserAchievement, string>;
  visitedAreas!: Table<VisitedArea, string>;
  userMarkers!: Table<UserMarker, string>;
  tradeHistory!: Table<TradeRecord, string>;
  seriesProgress!: Table<SeriesProgress, string>;

  constructor() {
    super('TreasureHuntP2P');
    
    this.version(1).stores({
      itemDefinitions: 'id, rarity, type',
      poiCache: 'id, latitude, longitude, poiType, expiresAt',
      inventory: 'id, itemId, collectedAt, isLocked',
      collectedSlots: '[poiId+timeSlot]',
      userProfile: 'id',
      shopItems: 'id, category, price',
      purchaseRecords: 'id, shopItemId, purchasedAt',
      gachaPools: 'id',
      gachaRecords: 'id, poolId, pulledAt',
      gachaPity: 'poolId',
      chests: 'id',
      userChests: 'id, chestId',
      cosmetics: 'id, type, rarity, price',
      userCosmetics: 'id, cosmeticId, cosmeticType, isEquipped',
      dailyTaskDefinitions: 'id, taskType',
      userDailyTasks: 'id, [taskDefinitionId+taskDate], taskDate, status',
      achievements: 'id, type, tier',
      userAchievements: 'id, achievementId, status',
      visitedAreas: 'id, areaId, latitude, longitude',
      userMarkers: 'id, latitude, longitude, iconType',
      tradeHistory: 'id, tradedAt',
      seriesProgress: 'id, seriesId, category',
    });
  }
}

export const db = new TreasureHuntDB();
