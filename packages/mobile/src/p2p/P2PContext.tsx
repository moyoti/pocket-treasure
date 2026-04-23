import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  identityService,
  databaseService,
  poiService,
  spawnService,
  LocalIdentity,
  POI,
  SpawnedTreasure,
  InventoryItem,
  UserProfile,
  ShopItemDefinition,
  GachaPoolDefinition,
  GachaPity,
  UserChest,
  UserCosmetic,
  UserDailyTask,
  UserAchievement,
  ItemRarity,
} from '../p2p';
import { ShopEngine } from '../p2p/engines/ShopEngine';
import { GachaEngine } from '../p2p/engines/GachaEngine';
import { ChestEngine } from '../p2p/engines/ChestEngine';
import { CosmeticEngine } from '../p2p/engines/CosmeticEngine';
import { DailyTaskEngine } from '../p2p/engines/DailyTaskEngine';
import { AchievementEngine } from '../p2p/engines/AchievementEngine';
import {
  ITEM_DEFINITIONS,
  SHOP_DEFINITIONS,
  GACHA_DEFINITIONS,
  CHEST_DEFINITIONS,
  COSMETIC_DEFINITIONS,
  DAILY_TASK_DEFINITIONS,
  ACHIEVEMENT_DEFINITIONS,
} from '../p2p/data';

interface GachaPullResult {
  success: boolean;
  error?: string;
  items: Array<{ itemId: string; rarity: ItemRarity; isPity: boolean }>;
  coinsSpent: number;
}

interface ShopPurchaseResult {
  success: boolean;
  error?: string;
  profile?: UserProfile;
  rewards?: ShopItemDefinition['rewards'];
}

interface ChestOpenResult {
  success: boolean;
  error?: string;
  items: Array<{ itemId: string; rarity: ItemRarity; quantity: number }>;
}

interface P2PContextValue {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  identity: LocalIdentity | null;
  profile: UserProfile | null;
  inventory: InventoryItem[];
  nearbyPOIs: POI[];
  nearbySpawns: SpawnedTreasure[];
  userLocation: { latitude: number; longitude: number } | null;
  userChests: UserChest[];
  userCosmetics: UserCosmetic[];
  dailyTasks: UserDailyTask[];
  achievements: UserAchievement[];
  gachaPities: Record<string, GachaPity>;
  shopItems: ShopItemDefinition[];
  gachaPools: GachaPoolDefinition[];

  refreshInventory: () => Promise<void>;
  refreshNearby: (lat: number, lng: number) => Promise<void>;
  collectTreasure: (spawn: SpawnedTreasure) => Promise<{ success: boolean; error?: string }>;
  updateDisplayName: (name: string) => Promise<void>;

  purchaseShopItem: (shopItemId: string, quantity: number) => Promise<ShopPurchaseResult>;
  pullGacha: (poolId: string, pullType: 'single' | 'ten') => Promise<GachaPullResult>;
  openChest: (chestId: string) => Promise<ChestOpenResult>;
  purchaseCosmetic: (cosmeticId: string) => Promise<{ success: boolean; error?: string }>;
  equipCosmetic: (cosmeticId: string) => Promise<{ success: boolean; error?: string }>;
  claimDailyTask: (taskDefinitionId: string) => Promise<{ success: boolean; error?: string; rewards?: any }>;
  claimAchievement: (achievementId: string) => Promise<{ success: boolean; error?: string; rewards?: any }>;
  refreshProfile: () => Promise<void>;
  refreshDailyTasks: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
}

const P2PContext = createContext<P2PContextValue | null>(null);

export function P2PProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [nearbyPOIs, setNearbyPOIs] = useState<POI[]>([]);
  const [nearbySpawns, setNearbySpawns] = useState<SpawnedTreasure[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userChests, setUserChests] = useState<UserChest[]>([]);
  const [userCosmetics, setUserCosmetics] = useState<UserCosmetic[]>([]);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [gachaPities, setGachaPities] = useState<Record<string, GachaPity>>({});
  const [shopItems, setShopItems] = useState<ShopItemDefinition[]>([]);
  const [gachaPools, setGachaPools] = useState<GachaPoolDefinition[]>([]);

  const [shopEngine, setShopEngine] = useState<ShopEngine | null>(null);
  const [gachaEngine, setGachaEngine] = useState<GachaEngine | null>(null);
  const [chestEngine, setChestEngine] = useState<ChestEngine | null>(null);
  const [cosmeticEngine, setCosmeticEngine] = useState<CosmeticEngine | null>(null);
  const [dailyTaskEngine, setDailyTaskEngine] = useState<DailyTaskEngine | null>(null);
  const [achievementEngine, setAchievementEngine] = useState<AchievementEngine | null>(null);

  useEffect(() => {
    initializeP2P();
  }, []);

  async function initializeP2P() {
    try {
      setIsLoading(true);
      setError(null);

      await databaseService.initialize();

      await databaseService.seedItemDefinitions(ITEM_DEFINITIONS);
      await databaseService.seedShopItems(SHOP_DEFINITIONS);
      await databaseService.seedGachaPools(GACHA_DEFINITIONS);
      await databaseService.seedChests(CHEST_DEFINITIONS);
      await databaseService.seedCosmetics(COSMETIC_DEFINITIONS);
      await databaseService.seedDailyTaskDefinitions(DAILY_TASK_DEFINITIONS);
      await databaseService.seedAchievements(ACHIEVEMENT_DEFINITIONS);

      const shop = new ShopEngine(databaseService);
      const gacha = new GachaEngine(databaseService);
      const chest = new ChestEngine(databaseService);
      const cosmetic = new CosmeticEngine(databaseService);
      const dailyTask = new DailyTaskEngine(databaseService);
      const achievement = new AchievementEngine(databaseService);

      await shop.initialize();
      await gacha.initialize();
      await chest.initialize();
      await cosmetic.initialize();
      await dailyTask.initialize();
      await achievement.initialize();

      setShopEngine(shop);
      setGachaEngine(gacha);
      setChestEngine(chest);
      setCosmeticEngine(cosmetic);
      setDailyTaskEngine(dailyTask);
      setAchievementEngine(achievement);

      const id = await identityService.initialize();
      setIdentity(id);

      const prof = await databaseService.getUserProfile();
      if (!prof) {
        const newProf = await databaseService.initUserProfile();
        setProfile(newProf);
      } else {
        setProfile(prof);
      }

      const inv = await databaseService.getInventory();
      setInventory(inv);

      const chests = await databaseService.getUserChests();
      setUserChests(chests);

      const cosmetics = await databaseService.getUserCosmetics();
      setUserCosmetics(cosmetics);

      const todayTasks = await dailyTask.getTodayTasks();
      setDailyTasks(todayTasks);

      const userAchs = await databaseService.getUserAchievements();
      setAchievements(userAchs);

      const shopItemsList = await shop.getShopItems();
      setShopItems(shopItemsList);

      const gachaPoolsList = await gacha.getGachaPools();
      setGachaPools(gachaPoolsList);

      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshInventory() {
    if (!isInitialized) return;
    const inv = await databaseService.getInventory();
    setInventory(inv);
  }

  async function refreshProfile() {
    if (!isInitialized) return;
    const prof = await databaseService.getUserProfile();
    setProfile(prof);
  }

  async function refreshNearby(lat: number, lng: number) {
    if (!isInitialized) return;

    setUserLocation({ latitude: lat, longitude: lng });

    try {
      const pois = await poiService.fetchNearbyPOIs(lat, lng, 2000);
      setNearbyPOIs(pois);

      const spawns = await spawnService.getNearbySpawns(lat, lng, 2000);
      setNearbySpawns(spawns);
    } catch (err) {
      console.error('Failed to refresh nearby:', err);
    }
  }

  async function collectTreasure(spawn: SpawnedTreasure): Promise<{ success: boolean; error?: string }> {
    if (!isInitialized || !userLocation) {
      return { success: false, error: 'Not initialized or no location' };
    }

    const result = await spawnService.collectItem(spawn, userLocation.latitude, userLocation.longitude);

    if (result.success) {
      await refreshInventory();
      await refreshProfile();
      setNearbySpawns(prev =>
        prev.map(s => s.poiId === spawn.poiId ? { ...s, isCollected: true } : s)
      );

      if (dailyTaskEngine) {
        await dailyTaskEngine.checkLoginTask();
        await dailyTaskEngine.checkCollectTask();
        await refreshDailyTasks();
      }

      if (achievementEngine) {
        const stats = await databaseService.getInventoryStats();
        await achievementEngine.checkCollectionAchievement(stats.total);
        await refreshAchievements();
      }
    }

    return result;
  }

  async function updateDisplayName(name: string) {
    if (!isInitialized) return;
    await identityService.updateDisplayName(name);
    setIdentity(prev => prev ? { ...prev, displayName: name } : null);
    await databaseService.updateUserProfile({ displayName: name });
    setProfile(prev => prev ? { ...prev, displayName: name } : null);
  }

  async function purchaseShopItem(shopItemId: string, quantity: number): Promise<ShopPurchaseResult> {
    if (!shopEngine) {
      return { success: false, error: 'Shop not initialized' };
    }

    const result = await shopEngine.purchaseItem(shopItemId, quantity);

    if (result.success) {
      await refreshProfile();
      await refreshInventory();

      if (result.rewards?.chestType && chestEngine) {
        const chests = await databaseService.getUserChests();
        setUserChests(chests);
      }
    }

    return result;
  }

  async function pullGacha(poolId: string, pullType: 'single' | 'ten'): Promise<GachaPullResult> {
    if (!gachaEngine) {
      return { success: false, error: 'Gacha not initialized', items: [], coinsSpent: 0 };
    }

    const result = await gachaEngine.pull(poolId, pullType);

    if (result.success) {
      await refreshProfile();
      await refreshInventory();

      const pity = await gachaEngine.getPity(poolId);
      setGachaPities(prev => ({ ...prev, [poolId]: pity }));

      if (dailyTaskEngine) {
        await dailyTaskEngine.checkLoginTask();
        await refreshDailyTasks();
      }
    }

    return result;
  }

  async function openChest(chestId: string): Promise<ChestOpenResult> {
    if (!chestEngine) {
      return { success: false, error: 'Chest engine not initialized', items: [] };
    }

    const result = await chestEngine.openChest(chestId);

    if (result.success) {
      await refreshProfile();
      await refreshInventory();

      const chests = await databaseService.getUserChests();
      setUserChests(chests);
    }

    return result;
  }

  async function purchaseCosmetic(cosmeticId: string): Promise<{ success: boolean; error?: string }> {
    if (!cosmeticEngine) {
      return { success: false, error: 'Cosmetic engine not initialized' };
    }

    const result = await cosmeticEngine.purchaseCosmetic(cosmeticId);

    if (result.success) {
      await refreshProfile();
      const cosmetics = await databaseService.getUserCosmetics();
      setUserCosmetics(cosmetics);
    }

    return result;
  }

  async function equipCosmetic(cosmeticId: string): Promise<{ success: boolean; error?: string }> {
    if (!cosmeticEngine) {
      return { success: false, error: 'Cosmetic engine not initialized' };
    }

    const result = await cosmeticEngine.equipCosmetic(cosmeticId);

    if (result.success) {
      const cosmetics = await databaseService.getUserCosmetics();
      setUserCosmetics(cosmetics);
    }

    return result;
  }

  async function refreshDailyTasks() {
    if (!dailyTaskEngine) return;
    const tasks = await dailyTaskEngine.getTodayTasks();
    setDailyTasks(tasks);
  }

  async function claimDailyTask(taskDefinitionId: string): Promise<{ success: boolean; error?: string; rewards?: any }> {
    if (!dailyTaskEngine) {
      return { success: false, error: 'Task engine not initialized' };
    }

    const result = await dailyTaskEngine.claimTask(taskDefinitionId);

    if (result.success) {
      await refreshProfile();
      await refreshDailyTasks();
    }

    return result;
  }

  async function refreshAchievements() {
    if (!achievementEngine) return;
    const userAchs = await databaseService.getUserAchievements();
    setAchievements(userAchs);
  }

  async function claimAchievement(achievementId: string): Promise<{ success: boolean; error?: string; rewards?: any }> {
    if (!achievementEngine) {
      return { success: false, error: 'Achievement engine not initialized' };
    }

    const result = await achievementEngine.claimAchievement(achievementId);

    if (result.success) {
      await refreshProfile();
      await refreshAchievements();
    }

    return result;
  }

  const value: P2PContextValue = {
    isInitialized,
    isLoading,
    error,
    identity,
    profile,
    inventory,
    nearbyPOIs,
    nearbySpawns,
    userLocation,
    userChests,
    userCosmetics,
    dailyTasks,
    achievements,
    gachaPities,
    shopItems,
    gachaPools,
    refreshInventory,
    refreshNearby,
    collectTreasure,
    updateDisplayName,
    purchaseShopItem,
    pullGacha,
    openChest,
    purchaseCosmetic,
    equipCosmetic,
    claimDailyTask,
    claimAchievement,
    refreshProfile,
    refreshDailyTasks,
    refreshAchievements,
  };

  return (
    <P2PContext.Provider value={value}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P(): P2PContextValue {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error('useP2P must be used within P2PProvider');
  }
  return context;
}