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
  TradeSession,
  TradeRecord,
  NearbyTrader,
  VisitedArea,
  SeriesProgress,
  UserMarker,
  TradeOffer,
} from '../p2p';
import { ShopEngine } from '../p2p/engines/ShopEngine';
import { GachaEngine } from '../p2p/engines/GachaEngine';
import { ChestEngine } from '../p2p/engines/ChestEngine';
import { CosmeticEngine } from '../p2p/engines/CosmeticEngine';
import { DailyTaskEngine } from '../p2p/engines/DailyTaskEngine';
import { AchievementEngine } from '../p2p/engines/AchievementEngine';
import { SellEngine, SellResult, SELL_PRICES } from '../p2p/engines/SellEngine';
import { tradeService } from '../p2p/trade/TradeService';
import { tradeEngine } from '../p2p/trade/TradeEngine';
import { areaService } from '../p2p/exploration/AreaService';
import { areaUnlockEngine } from '../p2p/exploration/AreaUnlockEngine';
import { markerService } from '../p2p/markers/MarkerService';
import { markerEngine } from '../p2p/markers/MarkerEngine';
import { MarkerIconType } from '../p2p/types';
import {
  ITEM_DEFINITIONS,
  SHOP_DEFINITIONS,
  GACHA_DEFINITIONS,
  CHEST_DEFINITIONS,
  COSMETIC_DEFINITIONS,
  DAILY_TASK_DEFINITIONS,
  ACHIEVEMENT_DEFINITIONS,
  SYNTHESIS_RECIPES,
  getItemById,
} from '../p2p/data';
import { getRandomItemOfRarity } from '../p2p/data/synthesis';
import { updateMissionProgress } from '../../utils/weeklyMissions';

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
  unequipCosmetic: (cosmeticType: string) => Promise<{ success: boolean; error?: string }>;
  claimDailyTask: (taskDefinitionId: string) => Promise<{ success: boolean; error?: string; rewards?: any }>;
  claimAchievement: (achievementId: string) => Promise<{ success: boolean; error?: string; rewards?: any }>;
  refreshProfile: () => Promise<void>;
  refreshDailyTasks: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
  sellItem: (inventoryItemId: string) => Promise<SellResult>;
  getSellPrice: (itemId: string) => number;
  sellPrices: Record<ItemRarity, number>;

  nearbyTraders: NearbyTrader[];
  activeTrade: TradeSession | null;
  tradeHistory: TradeRecord[];
  startTradeDiscovery: () => Promise<void>;
  stopTradeDiscovery: () => void;
  connectToTrader: (deviceId: string) => Promise<TradeSession | null>;
  sendTradeOffer: (offer: TradeOffer) => Promise<void>;
  acceptTradeOffer: () => Promise<void>;
  rejectTradeOffer: () => Promise<void>;
  executeTrade: (mySignature: string) => Promise<TradeRecord | null>;
  cancelTrade: () => Promise<void>;
  disconnectTrade: () => Promise<void>;
  refreshTradeHistory: () => Promise<void>;

  visitedAreas: VisitedArea[];
  areaUnlockProgress: { total: number; unlocked: number };
  startAreaTracking: () => Promise<void>;
  stopAreaTracking: () => void;
  refreshVisitedAreas: () => Promise<void>;
  checkAreaUnlock: (areaId: string) => Promise<boolean>;

  seriesProgress: SeriesProgress[];
  refreshSeriesProgress: () => Promise<void>;
  claimSeriesReward: (seriesId: string, milestone: '25' | '50' | '75' | 'completion') => Promise<{ success: boolean; error?: string; rewards?: any }>;

  userMarkers: UserMarker[];
  createMarker: (name: string, lat: number, lng: number, iconType: MarkerIconType, color?: string, description?: string) => Promise<UserMarker>;
  updateMarker: (id: string, updates: Partial<UserMarker>) => Promise<UserMarker | null>;
  deleteMarker: (id: string) => Promise<void>;
  refreshMarkers: () => Promise<void>;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number }>;

  synthesizeItems: (inventoryItemIds: string[], recipeId: string) => Promise<{ success: boolean; error?: string; newItemId?: string; newItemRarity?: ItemRarity }>;
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

  const [nearbyTraders, setNearbyTraders] = useState<NearbyTrader[]>([]);
  const [activeTrade, setActiveTrade] = useState<TradeSession | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);

  const [visitedAreas, setVisitedAreas] = useState<VisitedArea[]>([]);
  const [areaUnlockProgress, setAreaUnlockProgress] = useState<{ total: number; unlocked: number }>({ total: 0, unlocked: 0 });

  const [seriesProgress, setSeriesProgress] = useState<SeriesProgress[]>([]);

  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);

  const [shopEngine, setShopEngine] = useState<ShopEngine | null>(null);
  const [gachaEngine, setGachaEngine] = useState<GachaEngine | null>(null);
  const [chestEngine, setChestEngine] = useState<ChestEngine | null>(null);
  const [cosmeticEngine, setCosmeticEngine] = useState<CosmeticEngine | null>(null);
  const [dailyTaskEngine, setDailyTaskEngine] = useState<DailyTaskEngine | null>(null);
  const [achievementEngine, setAchievementEngine] = useState<AchievementEngine | null>(null);
  const [sellEngine, setSellEngine] = useState<SellEngine | null>(null);

  useEffect(() => {
    initializeP2P();
  }, []);

  async function initializeP2P() {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[P2P] Starting initialization...');

      console.log('[P2P] Initializing database...');
      await databaseService.initialize();
      console.log('[P2P] Database initialized');

      console.log('[P2P] Seeding data...');
      await databaseService.seedItemDefinitions(ITEM_DEFINITIONS);
      await databaseService.seedShopItems(SHOP_DEFINITIONS);
      await databaseService.seedGachaPools(GACHA_DEFINITIONS);
      await databaseService.seedChests(CHEST_DEFINITIONS);
      await databaseService.seedCosmetics(COSMETIC_DEFINITIONS);
      await databaseService.seedDailyTaskDefinitions(DAILY_TASK_DEFINITIONS);
      await databaseService.seedAchievements(ACHIEVEMENT_DEFINITIONS);
      console.log('[P2P] Data seeded');

      console.log('[P2P] Initializing engines...');
      const shop = new ShopEngine(databaseService);
      const gacha = new GachaEngine(databaseService);
      const chest = new ChestEngine(databaseService);
      const cosmetic = new CosmeticEngine(databaseService);
      const dailyTask = new DailyTaskEngine(databaseService);
      const achievement = new AchievementEngine(databaseService);
      const sell = new SellEngine(databaseService);

      await shop.initialize();
      await gacha.initialize();
      await chest.initialize();
      await cosmetic.initialize();
      await dailyTask.initialize();
      await achievement.initialize();
      console.log('[P2P] Engines initialized');

      setShopEngine(shop);
      setGachaEngine(gacha);
      setChestEngine(chest);
      setCosmeticEngine(cosmetic);
      setDailyTaskEngine(dailyTask);
      setAchievementEngine(achievement);
      setSellEngine(sell);

      console.log('[P2P] Initializing identity...');
      const id = await identityService.initialize();
      console.log('[P2P] Identity initialized:', id?.publicKey);
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

      await achievement.initializeSeriesProgress();
      const series = await databaseService.getSeriesProgress();
      setSeriesProgress(series);

      const areas = await databaseService.getVisitedAreas();
      setVisitedAreas(areas);
      const areaProgress = await areaService.getUnlockProgress();
      setAreaUnlockProgress(areaProgress);

      const markers = await databaseService.getUserMarkers();
      setUserMarkers(markers);

      const trades = await databaseService.getTradeHistory(20);
      setTradeHistory(trades);

      console.log('[P2P] Initialization complete!');
      setIsInitialized(true);
    } catch (err) {
      console.error('[P2P] Initialization error:', err);
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
    console.log('[P2PContext] refreshNearby called with:', lat, lng, 'isInitialized:', isInitialized);
    if (!isInitialized) {
      console.log('[P2PContext] Not initialized, skipping refreshNearby');
      return;
    }

    setUserLocation({ latitude: lat, longitude: lng });

    try {
      console.log('[P2PContext] Fetching nearby POIs...');
      const pois = await poiService.fetchNearbyPOIs(lat, lng, 5000);
      console.log('[P2PContext] Found POIs:', pois.length);
      setNearbyPOIs(pois);

      console.log('[P2PContext] Getting nearby spawns...');
      const spawns = await spawnService.getNearbySpawns(lat, lng, 5000);
      console.log('[P2PContext] Found spawns:', spawns.length, spawns.map(s => ({ poiId: s.poiId, itemId: s.itemId, isCollected: s.isCollected })));
      setNearbySpawns(spawns);
    } catch (err) {
      console.error('[P2PContext] Failed to refresh nearby:', err);
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
        await achievementEngine.updateSeriesProgressOnCollect(spawn.itemId);
        await refreshAchievements();
        await refreshSeriesProgress();
      }

      try {
        updateMissionProgress('weekly_collect_20_total', 1).catch(e => 
          console.log('Failed to update collection mission progress:', e)
        );
        const itemDef = getItemById(spawn.itemId);
        if (itemDef) {
          if (itemDef.rarity === 'common') {
            updateMissionProgress('weekly_collect_10_common', 1).catch(() => {});
          } else if (itemDef.rarity === 'rare') {
            updateMissionProgress('weekly_collect_5_rare', 1).catch(() => {});
          } else if (itemDef.rarity === 'epic') {
            updateMissionProgress('weekly_collect_3_epic', 1).catch(() => {});
          }
        }
      } catch (e) {
        console.log('Failed to update collection mission progress:', e);
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

  async function unequipCosmetic(cosmeticType: string): Promise<{ success: boolean; error?: string }> {
    if (!cosmeticEngine) {
      return { success: false, error: 'Cosmetic engine not initialized' };
    }

    await cosmeticEngine.unequipCosmetic(cosmeticType as any);
    const cosmetics = await databaseService.getUserCosmetics();
    setUserCosmetics(cosmetics);

    return { success: true };
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

  async function sellItem(inventoryItemId: string): Promise<SellResult> {
    if (!sellEngine) {
      return { success: false, error: 'Sell engine not initialized' };
    }

    const result = await sellEngine.sellItem(inventoryItemId);

    if (result.success) {
      await refreshInventory();
      await refreshProfile();
    }

    return result;
  }

  function getSellPrice(itemId: string): number {
    if (!sellEngine) return 0;
    return sellEngine.getSellPrice(itemId);
  }

  async function startTradeDiscovery(): Promise<void> {
    if (!identity) {
      console.error('No identity for trade discovery');
      return;
    }

    setNearbyTraders([]);

    await tradeService.startDiscovery(
      (trader: NearbyTrader) => {
        setNearbyTraders(prev => {
          if (prev.find(t => t.publicKey === trader.publicKey)) return prev;
          return [...prev, trader];
        });
      },
      (message) => {
        handleTradeMessage(message);
      }
    );
  }

  function stopTradeDiscovery(): void {
    tradeService.stopDiscovery();
    setNearbyTraders([]);
  }

  async function connectToTrader(deviceId: string): Promise<TradeSession | null> {
    if (!identity) return null;

    try {
      const session = await tradeService.connectToDevice(deviceId, identity);
      setActiveTrade(session);
      return session;
    } catch (error) {
      console.error('Failed to connect to trader:', error);
      return null;
    }
  }

  async function sendTradeOffer(offer: TradeOffer): Promise<void> {
    await tradeService.sendOffer(offer);
  }

  async function acceptTradeOffer(): Promise<void> {
    await tradeService.acceptOffer();
  }

  async function rejectTradeOffer(): Promise<void> {
    await tradeService.rejectOffer();
  }

  async function executeTrade(mySignature: string): Promise<TradeRecord | null> {
    const session = tradeService.getCurrentSession();
    if (!session || !session.myOffer || !session.partnerOffer) return null;

    try {
      const context = {
        offerId: session.sessionId,
        myPublicKey: identity?.publicKey || '',
        partnerPublicKey: session.partnerPublicKey,
        myOffer: session.myOffer,
        partnerOffer: session.partnerOffer,
        myItems: [],
        partnerItems: [],
      };

      const record = await tradeEngine.executeTrade(context, mySignature);
      
      await tradeService.completeTrade();
      await refreshInventory();
      await refreshTradeHistory();
      setActiveTrade(null);

      return record;
    } catch (error) {
      console.error('Trade execution failed:', error);
      return null;
    }
  }

  async function cancelTrade(): Promise<void> {
    await tradeService.cancelTrade();
    setActiveTrade(null);
  }

  async function disconnectTrade(): Promise<void> {
    await tradeService.disconnect();
    setActiveTrade(null);
    setNearbyTraders([]);
  }

  async function refreshTradeHistory(): Promise<void> {
    const trades = await databaseService.getTradeHistory(20);
    setTradeHistory(trades);
  }

  function handleTradeMessage(message: any): void {
    if (!activeTrade) return;

    if (message.type === 'offer' || message.type === 'counter') {
      setActiveTrade(prev => prev ? { ...prev, partnerOffer: message.payload } : null);
    } else if (message.type === 'accept') {
      setActiveTrade(prev => prev ? { ...prev, status: 'exchanging' } : null);
    } else if (message.type === 'reject' || message.type === 'cancel') {
      setActiveTrade(null);
    } else if (message.type === 'complete') {
      setActiveTrade(prev => prev ? { ...prev, status: 'completed' } : null);
    }
  }

  async function startAreaTracking(): Promise<void> {
    if (!userLocation) return;

    try {
      await areaService.initialize(
        (area) => {
          console.log('Entered area:', area.name);
        },
        (area) => {
          console.log('Exited area:', area.name);
        },
        (area) => {
          console.log('Area unlocked:', area.name);
          refreshVisitedAreas();
        }
      );

      await areaService.startTracking(userLocation.latitude, userLocation.longitude);
    } catch (error) {
      console.error('Failed to start area tracking:', error);
    }
  }

  function stopAreaTracking(): void {
    areaService.stopTracking();
  }

  async function refreshVisitedAreas(): Promise<void> {
    const areas = await databaseService.getVisitedAreas();
    setVisitedAreas(areas);
    const progress = await areaService.getUnlockProgress();
    setAreaUnlockProgress(progress);
  }

  async function checkAreaUnlock(areaId: string): Promise<boolean> {
    const result = await areaUnlockEngine.attemptUnlock(areaId);
    if (result) {
      await refreshVisitedAreas();
      await refreshProfile();
    }
    return result;
  }

  async function refreshSeriesProgress(): Promise<void> {
    const series = await databaseService.getSeriesProgress();
    setSeriesProgress(series);
  }

  async function claimSeriesReward(seriesId: string, milestone: '25' | '50' | '75' | 'completion'): Promise<{ success: boolean; error?: string; rewards?: any }> {
    if (!achievementEngine) {
      return { success: false, error: 'Achievement engine not initialized' };
    }

    const result = await achievementEngine.claimSeriesMilestone(seriesId, milestone);

    if (result.success) {
      await refreshProfile();
      await refreshSeriesProgress();
      await refreshInventory();
    }

    return result;
  }

  async function createMarker(
    name: string,
    latitude: number,
    longitude: number,
    iconType: MarkerIconType,
    color?: string,
    description?: string
  ): Promise<UserMarker> {
    const marker = await markerEngine.createMarkerWithValidation(
      name,
      latitude,
      longitude,
      iconType,
      color || '#FFD700',
      description
    );

    await refreshMarkers();
    return marker;
  }

  async function updateMarker(id: string, updates: Partial<UserMarker>): Promise<UserMarker | null> {
    const marker = await markerEngine.updateMarkerWithValidation(id, updates);
    await refreshMarkers();
    return marker;
  }

  async function deleteMarker(id: string): Promise<void> {
    await markerService.deleteMarker(id);
    await refreshMarkers();
  }

  async function refreshMarkers(): Promise<void> {
    const markers = await databaseService.getUserMarkers();
    setUserMarkers(markers);
  }

  async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Get location failed:', error);
          reject(new Error('Failed to get current location. Please enable GPS.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  async function synthesizeItems(
    inventoryItemIds: string[],
    recipeId: string
  ): Promise<{ success: boolean; error?: string; newItemId?: string; newItemRarity?: ItemRarity }> {
    const recipe = SYNTHESIS_RECIPES.find(r => r.id === recipeId);
    if (!recipe) {
      return { success: false, error: 'Invalid recipe' };
    }

    if (inventoryItemIds.length !== recipe.inputCount) {
      return { success: false, error: `Need exactly ${recipe.inputCount} items` };
    }

    if (!profile || profile.coins < recipe.coinCost) {
      return { success: false, error: 'Insufficient coins' };
    }

    const isSuccess = Math.random() < recipe.successRate;

    await databaseService.updateUserProfile({ coins: profile.coins - recipe.coinCost });

    for (const itemId of inventoryItemIds) {
      await databaseService.removeInventoryItem(itemId);
    }

    if (isSuccess) {
      const newItemDef = getRandomItemOfRarity(recipe.outputRarity);
      if (!newItemDef) {
        return { success: false, error: 'No items available for output rarity' };
      }

      const newInventoryItem: InventoryItem = {
        id: `synth_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        itemId: newItemDef.id,
        quantity: 1,
        sourceSignature: `synthesis_${Date.now()}`,
        collectedAt: Date.now(),
        isLocked: false,
      };

      await databaseService.addInventoryItem(newInventoryItem);
      await refreshInventory();
      await refreshProfile();

      updateMissionProgress('weekly_synthesize_3', 1).catch(e => 
        console.log('Failed to update synthesis mission progress:', e)
      );

      return { success: true, newItemId: newItemDef.id, newItemRarity: newItemDef.rarity };
    } else {
      await refreshInventory();
      await refreshProfile();
      return { success: false };
    }
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
    unequipCosmetic,
    claimDailyTask,
    claimAchievement,
    refreshProfile,
    refreshDailyTasks,
    refreshAchievements,
    sellItem,
    getSellPrice,
    sellPrices: SELL_PRICES,

    nearbyTraders,
    activeTrade,
    tradeHistory,
    startTradeDiscovery,
    stopTradeDiscovery,
    connectToTrader,
    sendTradeOffer,
    acceptTradeOffer,
    rejectTradeOffer,
    executeTrade,
    cancelTrade,
    disconnectTrade,
    refreshTradeHistory,

    visitedAreas,
    areaUnlockProgress,
    startAreaTracking,
    stopAreaTracking,
    refreshVisitedAreas,
    checkAreaUnlock,

    seriesProgress,
    refreshSeriesProgress,
    claimSeriesReward,

    userMarkers,
    createMarker,
    updateMarker,
    deleteMarker,
    refreshMarkers,
    getCurrentLocation,

    synthesizeItems,
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