import * as SQLite from 'expo-sqlite';
import { 
  ItemDefinition, 
  POI, 
  InventoryItem, 
  CollectedSlot, 
  ItemRarity,
  PoiType,
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
  TaskStatus,
  AchievementDefinition,
  UserAchievement,
  AchievementStatus,
  TradeRecord,
  VisitedArea,
  UserMarker,
  SeriesProgress,
  MarkerIconType,
  SeriesCategory,
} from '../types';

const DB_NAME = 'treasure_hunt_p2p.db';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS item_definitions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL,
        rarity TEXT NOT NULL,
        type TEXT NOT NULL,
        spawn_weight REAL NOT NULL,
        max_stack INTEGER NOT NULL,
        icon_url TEXT,
        version INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS poi_cache (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        poi_type TEXT NOT NULL,
        spawn_weight REAL NOT NULL,
        osm_type TEXT NOT NULL,
        tags TEXT,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        source_signature TEXT NOT NULL,
        source_poi_id TEXT,
        collected_at INTEGER NOT NULL,
        parent_id TEXT,
        is_locked INTEGER DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES item_definitions(id)
      );

      CREATE TABLE IF NOT EXISTS collected_slots (
        poi_id TEXT NOT NULL,
        time_slot INTEGER NOT NULL,
        collected_at INTEGER NOT NULL,
        PRIMARY KEY (poi_id, time_slot)
      );

      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        display_name TEXT NOT NULL DEFAULT 'Explorer',
        coins INTEGER DEFAULT 1000,
        total_coins_earned INTEGER DEFAULT 0,
        total_coins_spent INTEGER DEFAULT 0,
        experience INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        login_streak INTEGER DEFAULT 0,
        last_login_date INTEGER,
        lucky_points REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shop_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        rewards TEXT NOT NULL,
        is_available INTEGER DEFAULT 1,
        purchase_limit INTEGER DEFAULT 0,
        icon_url TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS purchase_records (
        id TEXT PRIMARY KEY,
        shop_item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        coins_spent INTEGER NOT NULL,
        purchased_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gacha_pools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL,
        single_price INTEGER NOT NULL,
        ten_price INTEGER NOT NULL,
        pity_min_rarity TEXT NOT NULL,
        pity_threshold INTEGER NOT NULL,
        items TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS gacha_records (
        id TEXT PRIMARY KEY,
        pool_id TEXT NOT NULL,
        pull_type TEXT NOT NULL,
        currency_used TEXT NOT NULL,
        coins_spent INTEGER NOT NULL,
        items_received TEXT NOT NULL,
        pulled_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gacha_pity (
        pool_id TEXT PRIMARY KEY,
        pity_count INTEGER DEFAULT 0,
        last_pull_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL,
        open_cost INTEGER NOT NULL,
        drop_pool TEXT NOT NULL,
        icon_url TEXT
      );

      CREATE TABLE IF NOT EXISTS user_chests (
        id TEXT PRIMARY KEY,
        chest_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        acquired_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cosmetics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        price INTEGER NOT NULL,
        icon_url TEXT,
        is_limited INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS user_cosmetics (
        id TEXT PRIMARY KEY,
        cosmetic_id TEXT NOT NULL,
        cosmetic_type TEXT NOT NULL,
        is_equipped INTEGER DEFAULT 0,
        equipped_at INTEGER,
        purchased_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_task_definitions (
        id TEXT PRIMARY KEY,
        task_type TEXT NOT NULL,
        target_progress INTEGER NOT NULL,
        rarity_requirement TEXT,
        rewards TEXT NOT NULL,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_daily_tasks (
        id TEXT PRIMARY KEY,
        task_definition_id TEXT NOT NULL,
        task_date TEXT NOT NULL,
        current_progress INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        completed_at INTEGER,
        claimed_at INTEGER,
        UNIQUE(task_definition_id, task_date)
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_zh TEXT,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL,
        requirement INTEGER NOT NULL,
        tier INTEGER NOT NULL,
        rarity_requirement TEXT,
        rewards TEXT NOT NULL,
        is_hidden INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        achievement_id TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        completed_at INTEGER,
        claimed_at INTEGER,
        UNIQUE(achievement_id)
      );

      -- New tables for client-side features expansion

      CREATE TABLE IF NOT EXISTS visited_areas (
        id TEXT PRIMARY KEY,
        area_id TEXT NOT NULL,
        area_name TEXT NOT NULL,
        area_name_zh TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius REAL NOT NULL,
        first_visit_at INTEGER NOT NULL,
        last_visit_at INTEGER NOT NULL,
        visit_count INTEGER DEFAULT 1,
        is_unlocked INTEGER DEFAULT 0,
        unlock_conditions TEXT,
        UNIQUE(area_id)
      );

      CREATE TABLE IF NOT EXISTS user_markers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        icon_type TEXT NOT NULL,
        color TEXT DEFAULT '#FFD700',
        creator_public_key TEXT NOT NULL,
        is_shared INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trade_history (
        id TEXT PRIMARY KEY,
        partner_public_key TEXT NOT NULL,
        partner_display_name TEXT,
        items_given TEXT NOT NULL,
        items_received TEXT NOT NULL,
        my_signature TEXT NOT NULL,
        partner_signature TEXT,
        trade_status TEXT NOT NULL,
        traded_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collection_series_progress (
        id TEXT PRIMARY KEY,
        series_id TEXT NOT NULL,
        series_name TEXT NOT NULL,
        series_name_zh TEXT,
        category TEXT NOT NULL,
        required_items TEXT NOT NULL,
        collected_items TEXT NOT NULL,
        progress_percent REAL DEFAULT 0,
        milestone_25 INTEGER DEFAULT 0,
        milestone_50 INTEGER DEFAULT 0,
        milestone_75 INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        completed_at INTEGER,
        rewards_claimed TEXT,
        UNIQUE(series_id)
      );

      CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(item_id);
      CREATE INDEX IF NOT EXISTS idx_poi_location ON poi_cache(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_poi_type ON poi_cache(poi_type);
      CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_date ON user_daily_tasks(task_date);
      CREATE INDEX IF NOT EXISTS idx_user_cosmetics_type ON user_cosmetics(cosmetic_type);
      CREATE INDEX IF NOT EXISTS idx_user_chests_chest ON user_chests(chest_id);
      CREATE INDEX IF NOT EXISTS idx_visited_areas_location ON visited_areas(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_user_markers_location ON user_markers(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_trade_history_time ON trade_history(traded_at);
      CREATE INDEX IF NOT EXISTS idx_series_progress ON collection_series_progress(series_id);
    `);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync(`
      DELETE FROM inventory;
      DELETE FROM collected_slots;
      DELETE FROM poi_cache;
      DELETE FROM purchase_records;
      DELETE FROM gacha_records;
      DELETE FROM user_chests;
      DELETE FROM user_cosmetics;
      DELETE FROM user_daily_tasks;
      DELETE FROM user_achievements;
      DELETE FROM gacha_pity;
      DELETE FROM visited_areas;
      DELETE FROM user_markers;
      DELETE FROM trade_history;
      DELETE FROM collection_series_progress;
    `);
  }

  async runMigration(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = await this.db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('visited_areas', 'user_markers', 'trade_history', 'collection_series_progress')"
    );

    const existingTables = tables.map(t => t.name);

    if (!existingTables.includes('visited_areas')) {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS visited_areas (
          id TEXT PRIMARY KEY,
          area_id TEXT NOT NULL,
          area_name TEXT NOT NULL,
          area_name_zh TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          radius REAL NOT NULL,
          first_visit_at INTEGER NOT NULL,
          last_visit_at INTEGER NOT NULL,
          visit_count INTEGER DEFAULT 1,
          is_unlocked INTEGER DEFAULT 0,
          unlock_conditions TEXT,
          UNIQUE(area_id)
        );
        CREATE INDEX IF NOT EXISTS idx_visited_areas_location ON visited_areas(latitude, longitude);
      `);
    }

    if (!existingTables.includes('user_markers')) {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_markers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          icon_type TEXT NOT NULL,
          color TEXT DEFAULT '#FFD700',
          creator_public_key TEXT NOT NULL,
          is_shared INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_user_markers_location ON user_markers(latitude, longitude);
      `);
    }

    if (!existingTables.includes('trade_history')) {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS trade_history (
          id TEXT PRIMARY KEY,
          partner_public_key TEXT NOT NULL,
          partner_display_name TEXT,
          items_given TEXT NOT NULL,
          items_received TEXT NOT NULL,
          my_signature TEXT NOT NULL,
          partner_signature TEXT,
          trade_status TEXT NOT NULL,
          traded_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_trade_history_time ON trade_history(traded_at);
      `);
    }

    if (!existingTables.includes('collection_series_progress')) {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS collection_series_progress (
          id TEXT PRIMARY KEY,
          series_id TEXT NOT NULL,
          series_name TEXT NOT NULL,
          series_name_zh TEXT,
          category TEXT NOT NULL,
          required_items TEXT NOT NULL,
          collected_items TEXT NOT NULL,
          progress_percent REAL DEFAULT 0,
          milestone_25 INTEGER DEFAULT 0,
          milestone_50 INTEGER DEFAULT 0,
          milestone_75 INTEGER DEFAULT 0,
          is_completed INTEGER DEFAULT 0,
          completed_at INTEGER,
          rewards_claimed TEXT,
          UNIQUE(series_id)
        );
        CREATE INDEX IF NOT EXISTS idx_series_progress ON collection_series_progress(series_id);
      `);
    }
  }

  async seedItemDefinitions(items: ItemDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const item of items) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO item_definitions 
         (id, name, name_zh, description, rarity, type, spawn_weight, max_stack, icon_url, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.nameZh || null,
          item.description,
          item.rarity,
          item.type,
          item.spawnWeight,
          item.maxStack,
          item.iconUrl || null,
          1
        ]
      );
    }
  }

  async getAllItemDefinitions(): Promise<ItemDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM item_definitions ORDER BY rarity, name'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      rarity: row.rarity as ItemRarity,
      type: row.type,
      spawnWeight: row.spawn_weight,
      maxStack: row.max_stack,
      iconUrl: row.icon_url,
    }));
  }

  async getItemsByRarity(rarity: ItemRarity): Promise<ItemDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM item_definitions WHERE rarity = ? ORDER BY name',
      [rarity]
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      rarity: row.rarity as ItemRarity,
      type: row.type,
      spawnWeight: row.spawn_weight,
      maxStack: row.max_stack,
      iconUrl: row.icon_url,
    }));
  }

  async getItemById(id: string): Promise<ItemDefinition | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM item_definitions WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      rarity: row.rarity as ItemRarity,
      type: row.type,
      spawnWeight: row.spawn_weight,
      maxStack: row.max_stack,
      iconUrl: row.icon_url,
    };
  }

  async getInventory(): Promise<InventoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM inventory WHERE is_locked = 0 ORDER BY collected_at DESC'
    );

    return rows.map(row => ({
      id: row.id,
      itemId: row.item_id,
      quantity: row.quantity,
      sourceSignature: row.source_signature,
      sourcePoiId: row.source_poi_id,
      collectedAt: row.collected_at,
      parentId: row.parent_id,
      isLocked: row.is_locked === 1,
    }));
  }

  async getInventoryByItem(itemId: string): Promise<InventoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM inventory WHERE item_id = ? AND is_locked = 0',
      [itemId]
    );

    return rows.map(row => ({
      id: row.id,
      itemId: row.item_id,
      quantity: row.quantity,
      sourceSignature: row.source_signature,
      sourcePoiId: row.source_poi_id,
      collectedAt: row.collected_at,
      parentId: row.parent_id,
      isLocked: row.is_locked === 1,
    }));
  }

  async addInventoryItem(item: InventoryItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO inventory 
       (id, item_id, quantity, source_signature, source_poi_id, collected_at, parent_id, is_locked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.itemId,
        item.quantity,
        item.sourceSignature,
        item.sourcePoiId || null,
        item.collectedAt,
        item.parentId || null,
        item.isLocked ? 1 : 0
      ]
    );
  }

  async removeInventoryItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM inventory WHERE id = ?', [id]);
  }

  async updateInventoryQuantity(id: string, quantity: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (quantity <= 0) {
      await this.removeInventoryItem(id);
    } else {
      await this.db.runAsync(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [quantity, id]
      );
    }
  }

  async setItemLocked(id: string, locked: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE inventory SET is_locked = ? WHERE id = ?',
      [locked ? 1 : 0, id]
    );
  }

  async getCollectedSlots(): Promise<CollectedSlot[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM collected_slots'
    );

    return rows.map(row => ({
      poiId: row.poi_id,
      timeSlot: row.time_slot,
      collectedAt: row.collected_at,
    }));
  }

  async addCollectedSlot(slot: CollectedSlot): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO collected_slots (poi_id, time_slot, collected_at)
       VALUES (?, ?, ?)`,
      [slot.poiId, slot.timeSlot, slot.collectedAt]
    );
  }

  async hasCollectedSlot(poiId: string, timeSlot: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT 1 FROM collected_slots WHERE poi_id = ? AND time_slot = ?',
      [poiId, timeSlot]
    );

    return row !== null;
  }

  async cachePOI(poi: POI): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const expiresAt = Date.now() + 7 * 24 * 3600 * 1000;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO poi_cache 
       (id, name, latitude, longitude, poi_type, spawn_weight, osm_type, tags, cached_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        poi.id,
        poi.name,
        poi.latitude,
        poi.longitude,
        poi.poiType,
        poi.spawnWeight,
        poi.osmType,
        poi.tags ? JSON.stringify(poi.tags) : null,
        poi.cachedAt,
        expiresAt
      ]
    );
  }

  async cachePOIs(pois: POI[]): Promise<void> {
    for (const poi of pois) {
      await this.cachePOI(poi);
    }
  }

  async getPOIsNearby(latitude: number, longitude: number, radiusKm: number): Promise<POI[]> {
    if (!this.db) throw new Error('Database not initialized');

    const latRange = radiusKm / 111.32;
    const lngRange = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
    const now = Date.now();

    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM poi_cache 
       WHERE latitude BETWEEN ? AND ?
       AND longitude BETWEEN ? AND ?
       AND expires_at > ?
       ORDER BY spawn_weight DESC`,
      [
        latitude - latRange,
        latitude + latRange,
        longitude - lngRange,
        longitude + lngRange,
        now
      ]
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      poiType: row.poi_type as PoiType,
      spawnWeight: row.spawn_weight,
      osmType: row.osm_type,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      cachedAt: row.cached_at,
    }));
  }

  async getPOIById(id: string): Promise<POI | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM poi_cache WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      poiType: row.poi_type as PoiType,
      spawnWeight: row.spawn_weight,
      osmType: row.osm_type,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      cachedAt: row.cached_at,
    };
  }

  async getItemCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM inventory'
    );

    return row?.count || 0;
  }

  async getInventoryStats(): Promise<{ total: number; byRarity: Record<ItemRarity, number> }> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      `SELECT i.rarity, COUNT(iv.id) as count
       FROM inventory iv
       JOIN item_definitions i ON iv.item_id = i.id
       GROUP BY i.rarity`
    );

    const byRarity: Record<ItemRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    for (const row of rows) {
      byRarity[row.rarity as ItemRarity] = row.count;
    }

    const total = await this.getItemCount();

    return { total, byRarity };
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM user_profile WHERE id = 1'
    );

    if (!row) return null;

    return {
      displayName: row.display_name,
      coins: row.coins,
      totalCoinsEarned: row.total_coins_earned,
      totalCoinsSpent: row.total_coins_spent,
      experience: row.experience,
      level: row.level,
      loginStreak: row.login_streak,
      lastLoginDate: row.last_login_date,
      luckyPoints: row.lucky_points,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async initUserProfile(): Promise<UserProfile> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    await this.db.runAsync(
      `INSERT OR IGNORE INTO user_profile (id, created_at, updated_at)
       VALUES (1, ?, ?)`,
      [now, now]
    );

    const profile = await this.getUserProfile();
    return profile!;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.displayName);
    }
    if (updates.coins !== undefined) {
      fields.push('coins = ?');
      values.push(updates.coins);
    }
    if (updates.totalCoinsEarned !== undefined) {
      fields.push('total_coins_earned = ?');
      values.push(updates.totalCoinsEarned);
    }
    if (updates.totalCoinsSpent !== undefined) {
      fields.push('total_coins_spent = ?');
      values.push(updates.totalCoinsSpent);
    }
    if (updates.experience !== undefined) {
      fields.push('experience = ?');
      values.push(updates.experience);
    }
    if (updates.level !== undefined) {
      fields.push('level = ?');
      values.push(updates.level);
    }
    if (updates.loginStreak !== undefined) {
      fields.push('login_streak = ?');
      values.push(updates.loginStreak);
    }
    if (updates.lastLoginDate !== undefined) {
      fields.push('last_login_date = ?');
      values.push(updates.lastLoginDate);
    }
    if (updates.luckyPoints !== undefined) {
      fields.push('lucky_points = ?');
      values.push(updates.luckyPoints);
    }

    fields.push('updated_at = ?');
    values.push(now);

    if (fields.length > 1) {
      await this.db.runAsync(
        `UPDATE user_profile SET ${fields.join(', ')} WHERE id = 1`,
        values
      );
    }
  }

  async addCoins(amount: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE user_profile SET 
       coins = coins + ?, 
       total_coins_earned = total_coins_earned + ?, 
       updated_at = ? 
       WHERE id = 1`,
      [amount, amount > 0 ? amount : 0, Date.now()]
    );

    const profile = await this.getUserProfile();
    return profile?.coins || 0;
  }

  async spendCoins(amount: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const profile = await this.getUserProfile();
    if (!profile || profile.coins < amount) return false;

    await this.db.runAsync(
      `UPDATE user_profile SET 
       coins = coins - ?, 
       total_coins_spent = total_coins_spent + ?, 
       updated_at = ? 
       WHERE id = 1`,
      [amount, amount, Date.now()]
    );

    return true;
  }

  async seedShopItems(items: ShopItemDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const item of items) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO shop_items 
         (id, name, name_zh, description, category, price, rewards, is_available, purchase_limit, icon_url, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.nameZh || null,
          item.description,
          item.category,
          item.price,
          JSON.stringify(item.rewards),
          item.isAvailable ? 1 : 0,
          item.purchaseLimit,
          item.iconUrl || null,
          item.metadata ? JSON.stringify(item.metadata) : null,
        ]
      );
    }
  }

  async getShopItems(): Promise<ShopItemDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM shop_items WHERE is_available = 1 ORDER BY price'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      category: row.category,
      price: row.price,
      rewards: JSON.parse(row.rewards),
      isAvailable: row.is_available === 1,
      purchaseLimit: row.purchase_limit,
      iconUrl: row.icon_url,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  async addPurchaseRecord(record: PurchaseRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO purchase_records (id, shop_item_id, quantity, coins_spent, purchased_at)
       VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.shopItemId, record.quantity, record.coinsSpent, record.purchasedAt]
    );
  }

  async seedGachaPools(pools: GachaPoolDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const pool of pools) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO gacha_pools 
         (id, name, name_zh, description, single_price, ten_price, pity_min_rarity, pity_threshold, items, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pool.id,
          pool.name,
          pool.nameZh || null,
          pool.description,
          pool.singlePrice,
          pool.tenPrice,
          pool.pityMinRarity,
          pool.pityThreshold,
          JSON.stringify(pool.items),
          pool.isActive ? 1 : 0,
        ]
      );
    }
  }

  async getGachaPools(): Promise<GachaPoolDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM gacha_pools WHERE is_active = 1'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      singlePrice: row.single_price,
      tenPrice: row.ten_price,
      pityMinRarity: row.pity_min_rarity as ItemRarity,
      pityThreshold: row.pity_threshold,
      items: JSON.parse(row.items),
      isActive: row.is_active === 1,
    }));
  }

  async getGachaPity(poolId: string): Promise<GachaPity> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM gacha_pity WHERE pool_id = ?',
      [poolId]
    );

    if (!row) {
      return { poolId, pityCount: 0, lastPullAt: Date.now() };
    }

    return {
      poolId: row.pool_id,
      pityCount: row.pity_count,
      lastPullAt: row.last_pull_at,
    };
  }

  async updateGachaPity(poolId: string, pityCount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO gacha_pity (pool_id, pity_count, last_pull_at)
       VALUES (?, ?, ?)`,
      [poolId, pityCount, Date.now()]
    );
  }

  async addGachaRecord(record: GachaRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO gacha_records (id, pool_id, pull_type, currency_used, coins_spent, items_received, pulled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.poolId,
        record.pullType,
        record.currencyUsed,
        record.coinsSpent,
        JSON.stringify(record.itemsReceived),
        record.pulledAt,
      ]
    );
  }

  async seedChests(chests: ChestDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const chest of chests) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO chests 
         (id, name, name_zh, description, open_cost, drop_pool, icon_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          chest.id,
          chest.name,
          chest.nameZh || null,
          chest.description,
          chest.openCost,
          JSON.stringify(chest.dropPool),
          chest.iconUrl || null,
        ]
      );
    }
  }

  async getChests(): Promise<ChestDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM chests');

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      openCost: row.open_cost,
      dropPool: JSON.parse(row.drop_pool),
      iconUrl: row.icon_url,
    }));
  }

  async getUserChests(): Promise<UserChest[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM user_chests');

    return rows.map(row => ({
      id: row.id,
      chestId: row.chest_id,
      quantity: row.quantity,
      acquiredAt: row.acquired_at,
    }));
  }

  async addUserChest(chestId: string, quantity: number = 1): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.db.getFirstAsync<any>(
      'SELECT * FROM user_chests WHERE chest_id = ?',
      [chestId]
    );

    if (existing) {
      await this.db.runAsync(
        'UPDATE user_chests SET quantity = quantity + ? WHERE chest_id = ?',
        [quantity, chestId]
      );
    } else {
      await this.db.runAsync(
        `INSERT INTO user_chests (id, chest_id, quantity, acquired_at)
         VALUES (?, ?, ?, ?)`,
        [`${chestId}_${Date.now()}`, chestId, quantity, Date.now()]
      );
    }
  }

  async removeUserChest(chestId: string, quantity: number = 1): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.db.getFirstAsync<any>(
      'SELECT * FROM user_chests WHERE chest_id = ?',
      [chestId]
    );

    if (!existing || existing.quantity < quantity) return false;

    if (existing.quantity <= quantity) {
      await this.db.runAsync('DELETE FROM user_chests WHERE chest_id = ?', [chestId]);
    } else {
      await this.db.runAsync(
        'UPDATE user_chests SET quantity = quantity - ? WHERE chest_id = ?',
        [quantity, chestId]
      );
    }

    return true;
  }

  async seedCosmetics(cosmetics: CosmeticDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const cosmetic of cosmetics) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO cosmetics 
         (id, name, name_zh, description, type, rarity, price, icon_url, is_limited, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cosmetic.id,
          cosmetic.name,
          cosmetic.nameZh || null,
          cosmetic.description,
          cosmetic.type,
          cosmetic.rarity,
          cosmetic.price,
          cosmetic.iconUrl || null,
          cosmetic.isLimited ? 1 : 0,
          cosmetic.isActive ? 1 : 0,
        ]
      );
    }
  }

  async getCosmetics(): Promise<CosmeticDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM cosmetics WHERE is_active = 1'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      type: row.type as CosmeticType,
      rarity: row.rarity as ItemRarity,
      price: row.price,
      iconUrl: row.icon_url,
      isLimited: row.is_limited === 1,
      isActive: row.is_active === 1,
    }));
  }

  async getUserCosmetics(): Promise<UserCosmetic[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM user_cosmetics');

    return rows.map(row => ({
      id: row.id,
      cosmeticId: row.cosmetic_id,
      cosmeticType: row.cosmetic_type as CosmeticType,
      isEquipped: row.is_equipped === 1,
      equippedAt: row.equipped_at,
      purchasedAt: row.purchased_at,
    }));
  }

  async addUserCosmetic(cosmeticId: string, cosmeticType: CosmeticType): Promise<UserCosmetic> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const id = `${cosmeticId}_${now}`;

    await this.db.runAsync(
      `INSERT INTO user_cosmetics (id, cosmetic_id, cosmetic_type, is_equipped, purchased_at)
       VALUES (?, ?, ?, 0, ?)`,
      [id, cosmeticId, cosmeticType, now]
    );

    return {
      id,
      cosmeticId,
      cosmeticType,
      isEquipped: false,
      purchasedAt: now,
    };
  }

  async equipCosmetic(cosmeticId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cosmetic = await this.db.getFirstAsync<any>(
      'SELECT * FROM cosmetics WHERE id = ?',
      [cosmeticId]
    );

    if (!cosmetic) return;

    const cosmeticType = cosmetic.type as CosmeticType;
    const now = Date.now();

    await this.db.runAsync(
      'UPDATE user_cosmetics SET is_equipped = 0 WHERE cosmetic_type = ?',
      [cosmeticType]
    );

    await this.db.runAsync(
      'UPDATE user_cosmetics SET is_equipped = 1, equipped_at = ? WHERE cosmetic_id = ?',
      [now, cosmeticId]
    );
  }

  async unequipCosmetic(cosmeticType: CosmeticType): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE user_cosmetics SET is_equipped = 0, equipped_at = NULL WHERE cosmetic_type = ?',
      [cosmeticType]
    );
  }

  async getEquippedCosmetics(): Promise<UserCosmetic[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM user_cosmetics WHERE is_equipped = 1'
    );

    return rows.map(row => ({
      id: row.id,
      cosmeticId: row.cosmetic_id,
      cosmeticType: row.cosmetic_type as CosmeticType,
      isEquipped: true,
      equippedAt: row.equipped_at,
      purchasedAt: row.purchased_at,
    }));
  }

  async seedDailyTaskDefinitions(tasks: DailyTaskDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const task of tasks) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO daily_task_definitions 
         (id, task_type, target_progress, rarity_requirement, rewards, name, name_zh, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.taskType,
          task.targetProgress,
          task.rarityRequirement || null,
          JSON.stringify(task.rewards),
          task.name,
          task.nameZh || null,
          task.description,
        ]
      );
    }
  }

  async getDailyTaskDefinitions(): Promise<DailyTaskDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM daily_task_definitions');

    return rows.map(row => ({
      id: row.id,
      taskType: row.task_type,
      targetProgress: row.target_progress,
      rarityRequirement: row.rarity_requirement,
      rewards: JSON.parse(row.rewards),
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
    }));
  }

  async getUserDailyTasks(taskDate: string): Promise<UserDailyTask[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM user_daily_tasks WHERE task_date = ?',
      [taskDate]
    );

    return rows.map(row => ({
      id: row.id,
      taskDefinitionId: row.task_definition_id,
      taskDate: row.task_date,
      currentProgress: row.current_progress,
      status: row.status as TaskStatus,
      completedAt: row.completed_at,
      claimedAt: row.claimed_at,
    }));
  }

  async initDailyTasksForDate(taskDate: string): Promise<UserDailyTask[]> {
    if (!this.db) throw new Error('Database not initialized');

    const definitions = await this.getDailyTaskDefinitions();
    const tasks: UserDailyTask[] = [];

    for (const def of definitions) {
      const id = `${def.id}_${taskDate}`;
      await this.db.runAsync(
        `INSERT OR IGNORE INTO user_daily_tasks 
         (id, task_definition_id, task_date, current_progress, status)
         VALUES (?, ?, ?, 0, 'in_progress')`,
        [id, def.id, taskDate]
      );

      tasks.push({
        id,
        taskDefinitionId: def.id,
        taskDate,
        currentProgress: 0,
        status: 'in_progress',
        completedAt: null,
        claimedAt: null,
      });
    }

    return tasks;
  }

  async updateDailyTaskProgress(taskDefinitionId: string, taskDate: string, progress: number): Promise<UserDailyTask | null> {
    if (!this.db) throw new Error('Database not initialized');

    const definition = await this.db.getFirstAsync<any>(
      'SELECT * FROM daily_task_definitions WHERE id = ?',
      [taskDefinitionId]
    );

    if (!definition) return null;

    const targetProgress = definition.target_progress;
    const newStatus = progress >= targetProgress ? 'completed' : 'in_progress';
    const completedAt = progress >= targetProgress ? Date.now() : null;

    await this.db.runAsync(
      `UPDATE user_daily_tasks SET current_progress = ?, status = ?, completed_at = ? 
       WHERE task_definition_id = ? AND task_date = ?`,
      [progress, newStatus, completedAt, taskDefinitionId, taskDate]
    );

    return await this.getUserDailyTask(taskDefinitionId, taskDate);
  }

  async getUserDailyTask(taskDefinitionId: string, taskDate: string): Promise<UserDailyTask | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM user_daily_tasks WHERE task_definition_id = ? AND task_date = ?',
      [taskDefinitionId, taskDate]
    );

    if (!row) return null;

    return {
      id: row.id,
      taskDefinitionId: row.task_definition_id,
      taskDate: row.task_date,
      currentProgress: row.current_progress,
      status: row.status as TaskStatus,
      completedAt: row.completed_at,
      claimedAt: row.claimed_at,
    };
  }

  async claimDailyTask(taskDefinitionId: string, taskDate: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const task = await this.getUserDailyTask(taskDefinitionId, taskDate);
    if (!task || task.status !== 'completed' || task.claimedAt) return false;

    await this.db.runAsync(
      `UPDATE user_daily_tasks SET status = 'claimed', claimed_at = ? 
       WHERE task_definition_id = ? AND task_date = ?`,
      [Date.now(), taskDefinitionId, taskDate]
    );

    return true;
  }

  async seedAchievements(achievements: AchievementDefinition[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const ach of achievements) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO achievements 
         (id, name, name_zh, description, icon, type, requirement, tier, rarity_requirement, rewards, is_hidden, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ach.id,
          ach.name,
          ach.nameZh || null,
          ach.description,
          ach.icon,
          ach.type,
          ach.requirement,
          ach.tier,
          ach.rarityRequirement || null,
          JSON.stringify(ach.rewards),
          ach.isHidden ? 1 : 0,
          ach.isActive ? 1 : 0,
        ]
      );
    }
  }

  async getAchievements(): Promise<AchievementDefinition[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM achievements WHERE is_active = 1 ORDER BY tier, requirement'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      nameZh: row.name_zh,
      description: row.description,
      icon: row.icon,
      type: row.type,
      requirement: row.requirement,
      tier: row.tier,
      rarityRequirement: row.rarity_requirement,
      rewards: JSON.parse(row.rewards),
      isHidden: row.is_hidden === 1,
      isActive: row.is_active === 1,
    }));
  }

  async getUserAchievements(): Promise<UserAchievement[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM user_achievements');

    return rows.map(row => ({
      id: row.id,
      achievementId: row.achievement_id,
      progress: row.progress,
      status: row.status as AchievementStatus,
      completedAt: row.completed_at,
      claimedAt: row.claimed_at,
    }));
  }

  async initUserAchievements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const achievements = await this.getAchievements();

    for (const ach of achievements) {
      await this.db.runAsync(
        `INSERT OR IGNORE INTO user_achievements (id, achievement_id, progress, status)
         VALUES (?, ?, 0, 'in_progress')`,
        [ach.id, ach.id]
      );
    }
  }

  async updateAchievementProgress(achievementId: string, progress: number): Promise<UserAchievement | null> {
    if (!this.db) throw new Error('Database not initialized');

    const achievement = await this.db.getFirstAsync<any>(
      'SELECT * FROM achievements WHERE id = ?',
      [achievementId]
    );

    if (!achievement) return null;

    const requirement = achievement.requirement;
    const newStatus = progress >= requirement ? 'completed' : 'in_progress';
    const completedAt = progress >= requirement ? Date.now() : null;

    await this.db.runAsync(
      `UPDATE user_achievements SET progress = ?, status = ?, completed_at = ? WHERE achievement_id = ?`,
      [progress, newStatus, completedAt, achievementId]
    );

    return await this.getUserAchievement(achievementId);
  }

  async getUserAchievement(achievementId: string): Promise<UserAchievement | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM user_achievements WHERE achievement_id = ?',
      [achievementId]
    );

    if (!row) return null;

    return {
      id: row.id,
      achievementId: row.achievement_id,
      progress: row.progress,
      status: row.status as AchievementStatus,
      completedAt: row.completed_at,
      claimedAt: row.claimed_at,
    };
  }

  async claimAchievement(achievementId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const userAch = await this.getUserAchievement(achievementId);
    if (!userAch || userAch.status !== 'completed' || userAch.claimedAt) return false;

    await this.db.runAsync(
      `UPDATE user_achievements SET status = 'claimed', claimed_at = ? WHERE achievement_id = ?`,
      [Date.now(), achievementId]
    );

    return true;
  }

  // ============================================
  // VISITED AREAS METHODS
  // ============================================

  async getVisitedAreas(): Promise<VisitedArea[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM visited_areas ORDER BY last_visit_at DESC');

    return rows.map(row => ({
      id: row.id,
      areaId: row.area_id,
      areaName: row.area_name,
      areaNameZh: row.area_name_zh,
      latitude: row.latitude,
      longitude: row.longitude,
      radius: row.radius,
      firstVisitAt: row.first_visit_at,
      lastVisitAt: row.last_visit_at,
      visitCount: row.visit_count,
      isUnlocked: row.is_unlocked === 1,
      unlockConditions: row.unlock_conditions,
    }));
  }

  async addVisitedArea(area: VisitedArea): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO visited_areas 
       (id, area_id, area_name, area_name_zh, latitude, longitude, radius, first_visit_at, last_visit_at, visit_count, is_unlocked, unlock_conditions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        area.id,
        area.areaId,
        area.areaName,
        area.areaNameZh || null,
        area.latitude,
        area.longitude,
        area.radius,
        area.firstVisitAt,
        area.lastVisitAt,
        area.visitCount,
        area.isUnlocked ? 1 : 0,
        area.unlockConditions || null,
      ]
    );
  }

  async updateAreaVisit(areaId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.db.getFirstAsync<any>(
      'SELECT * FROM visited_areas WHERE area_id = ?',
      [areaId]
    );

    if (existing) {
      await this.db.runAsync(
        `UPDATE visited_areas SET last_visit_at = ?, visit_count = visit_count + 1 WHERE area_id = ?`,
        [Date.now(), areaId]
      );
    }
  }

  async unlockArea(areaId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE visited_areas SET is_unlocked = 1 WHERE area_id = ?',
      [areaId]
    );
  }

  // ============================================
  // USER MARKERS METHODS
  // ============================================

  async getUserMarkers(): Promise<UserMarker[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM user_markers ORDER BY created_at DESC');

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      iconType: row.icon_type as MarkerIconType,
      color: row.color,
      creatorPublicKey: row.creator_public_key,
      isShared: row.is_shared === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async addUserMarker(marker: UserMarker): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_markers 
       (id, name, description, latitude, longitude, icon_type, color, creator_public_key, is_shared, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marker.id,
        marker.name,
        marker.description || null,
        marker.latitude,
        marker.longitude,
        marker.iconType,
        marker.color,
        marker.creatorPublicKey,
        marker.isShared ? 1 : 0,
        marker.createdAt,
        marker.updatedAt,
      ]
    );
  }

  async updateUserMarker(id: string, updates: Partial<UserMarker>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(updates.latitude);
    }
    if (updates.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(updates.longitude);
    }
    if (updates.iconType !== undefined) {
      fields.push('icon_type = ?');
      values.push(updates.iconType);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.isShared !== undefined) {
      fields.push('is_shared = ?');
      values.push(updates.isShared ? 1 : 0);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());

    if (fields.length > 1) {
      await this.db.runAsync(
        `UPDATE user_markers SET ${fields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
    }
  }

  async deleteUserMarker(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM user_markers WHERE id = ?', [id]);
  }

  // ============================================
  // TRADE HISTORY METHODS
  // ============================================

  async getTradeHistory(limit: number = 20): Promise<TradeRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM trade_history ORDER BY traded_at DESC LIMIT ?',
      [limit]
    );

    return rows.map(row => ({
      id: row.id,
      partnerPublicKey: row.partner_public_key,
      partnerDisplayName: row.partner_display_name,
      itemsGiven: JSON.parse(row.items_given),
      itemsReceived: JSON.parse(row.items_received),
      mySignature: row.my_signature,
      partnerSignature: row.partner_signature,
      tradeStatus: row.trade_status,
      tradedAt: row.traded_at,
    }));
  }

  async addTradeRecord(record: TradeRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO trade_history 
       (id, partner_public_key, partner_display_name, items_given, items_received, my_signature, partner_signature, trade_status, traded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.partnerPublicKey,
        record.partnerDisplayName || null,
        JSON.stringify(record.itemsGiven),
        JSON.stringify(record.itemsReceived),
        record.mySignature,
        record.partnerSignature || null,
        record.tradeStatus,
        record.tradedAt,
      ]
    );
  }

  // ============================================
  // SERIES PROGRESS METHODS
  // ============================================

  async getSeriesProgress(): Promise<SeriesProgress[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync<any>('SELECT * FROM collection_series_progress ORDER BY category, series_name');

    return rows.map(row => ({
      id: row.id,
      seriesId: row.series_id,
      seriesName: row.series_name,
      seriesNameZh: row.series_name_zh,
      category: row.category as SeriesCategory,
      requiredItems: JSON.parse(row.required_items),
      collectedItems: JSON.parse(row.collected_items),
      progressPercent: row.progress_percent,
      milestone25: row.milestone_25 === 1,
      milestone50: row.milestone_50 === 1,
      milestone75: row.milestone_75 === 1,
      isCompleted: row.is_completed === 1,
      completedAt: row.completed_at,
      rewardsClaimed: JSON.parse(row.rewards_claimed || '[]'),
    }));
  }

  async initSeriesProgress(series: { id: string; name: string; nameZh?: string; category: SeriesCategory; requiredItems: string[] }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR IGNORE INTO collection_series_progress 
       (id, series_id, series_name, series_name_zh, category, required_items, collected_items, progress_percent, milestone_25, milestone_50, milestone_75, is_completed, rewards_claimed)
       VALUES (?, ?, ?, ?, ?, ?, '[]', 0, 0, 0, 0, 0, '[]')`,
      [series.id, series.id, series.name, series.nameZh || null, series.category, JSON.stringify(series.requiredItems)]
    );
  }

  async updateSeriesProgress(seriesId: string, collectedItems: string[]): Promise<SeriesProgress | null> {
    if (!this.db) throw new Error('Database not initialized');

    const series = await this.db.getFirstAsync<any>(
      'SELECT * FROM collection_series_progress WHERE series_id = ?',
      [seriesId]
    );

    if (!series) return null;

    const requiredItems = JSON.parse(series.required_items);
    const progressPercent = (collectedItems.filter(i => requiredItems.includes(i)).length / requiredItems.length) * 100;
    const milestone25 = progressPercent >= 25;
    const milestone50 = progressPercent >= 50;
    const milestone75 = progressPercent >= 75;
    const isCompleted = progressPercent >= 100;
    const completedAt = isCompleted ? Date.now() : null;

    await this.db.runAsync(
      `UPDATE collection_series_progress SET 
       collected_items = ?, progress_percent = ?, milestone_25 = ?, milestone_50 = ?, milestone_75 = ?, is_completed = ?, completed_at = ?
       WHERE series_id = ?`,
      [
        JSON.stringify(collectedItems),
        progressPercent,
        milestone25 ? 1 : 0,
        milestone50 ? 1 : 0,
        milestone75 ? 1 : 0,
        isCompleted ? 1 : 0,
        completedAt,
        seriesId,
      ]
    );

    return await this.getSeriesProgressById(seriesId);
  }

  async getSeriesProgressById(seriesId: string): Promise<SeriesProgress | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM collection_series_progress WHERE series_id = ?',
      [seriesId]
    );

    if (!row) return null;

    return {
      id: row.id,
      seriesId: row.series_id,
      seriesName: row.series_name,
      seriesNameZh: row.series_name_zh,
      category: row.category as SeriesCategory,
      requiredItems: JSON.parse(row.required_items),
      collectedItems: JSON.parse(row.collected_items),
      progressPercent: row.progress_percent,
      milestone25: row.milestone_25 === 1,
      milestone50: row.milestone_50 === 1,
      milestone75: row.milestone_75 === 1,
      isCompleted: row.is_completed === 1,
      completedAt: row.completed_at,
      rewardsClaimed: JSON.parse(row.rewards_claimed || '[]'),
    };
  }

  async claimSeriesReward(seriesId: string, milestone: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const series = await this.getSeriesProgressById(seriesId);
    if (!series) return false;

    const rewardsClaimed = series.rewardsClaimed;
    if (rewardsClaimed.includes(milestone)) return false;

    const milestoneKey = milestone === '25' ? 'milestone_25' : milestone === '50' ? 'milestone_50' : milestone === '75' ? 'milestone_75' : 'is_completed';
    const milestoneValue = milestone === 'completion' ? series.isCompleted : series[`milestone${milestone}` as keyof SeriesProgress];
    
    if (!milestoneValue) return false;

    rewardsClaimed.push(milestone);
    await this.db.runAsync(
      'UPDATE collection_series_progress SET rewards_claimed = ? WHERE series_id = ?',
      [JSON.stringify(rewardsClaimed), seriesId]
    );

    return true;
  }
}

export const databaseService = new DatabaseService();