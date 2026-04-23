import { DatabaseService } from '../database/DatabaseService';
import { GachaPoolDefinition, GachaRecord, GachaPity, ItemRarity, InventoryItem } from '../types';
import { GACHA_DEFINITIONS, getGachaPoolById, rollRarity } from '../data/gacha';
import { ITEM_DEFINITIONS, getItemsByRarity } from '../data/items';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export class GachaEngine {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    await this.db.seedGachaPools(GACHA_DEFINITIONS);
    await this.db.seedItemDefinitions(ITEM_DEFINITIONS);
  }

  async getGachaPools(): Promise<GachaPoolDefinition[]> {
    return await this.db.getGachaPools();
  }

  async getGachaPool(poolId: string): Promise<GachaPoolDefinition | undefined> {
    const pools = await this.getGachaPools();
    return pools.find(pool => pool.id === poolId);
  }

  async pull(poolId: string, pullType: 'single' | 'ten'): Promise<{
    success: boolean;
    error?: string;
    items: Array<{ itemId: string; rarity: ItemRarity; isPity: boolean }>;
    coinsSpent: number;
  }> {
    const pool = await this.getGachaPool(poolId);
    if (!pool) {
      return { success: false, error: 'Pool not found', items: [], coinsSpent: 0 };
    }

    const price = pullType === 'single' ? pool.singlePrice : pool.tenPrice;
    const pullCount = pullType === 'single' ? 1 : 10;

    const canSpend = await this.db.spendCoins(price);
    if (!canSpend) {
      return { success: false, error: 'Insufficient coins', items: [], coinsSpent: 0 };
    }

    const pity = await this.db.getGachaPity(poolId);
    const items: Array<{ itemId: string; rarity: ItemRarity; isPity: boolean }> = [];

    for (let i = 0; i < pullCount; i++) {
      const result = await this.pullSingle(pool, pity);
      items.push(result);
    }

    const record: GachaRecord = {
      id: generateId(),
      poolId,
      pullType,
      currencyUsed: 'coins',
      coinsSpent: price,
      itemsReceived: items,
      pulledAt: Date.now(),
    };
    await this.db.addGachaRecord(record);

    await this.db.updateGachaPity(poolId, pity.pityCount);

    return { success: true, items, coinsSpent: price };
  }

  private async pullSingle(
    pool: GachaPoolDefinition,
    pity: GachaPity
  ): Promise<{ itemId: string; rarity: ItemRarity; isPity: boolean }> {
    pity.pityCount++;

    let rarity: ItemRarity;
    let isPity = false;

    if (pity.pityCount >= pool.pityThreshold) {
      rarity = pool.pityMinRarity;
      isPity = true;
      pity.pityCount = 0;
    } else {
      rarity = rollRarity(pool);
      if (this.isRarityAtOrAbove(rarity, pool.pityMinRarity)) {
        pity.pityCount = 0;
      }
    }

    const itemsOfRarity = getItemsByRarity(rarity);
    const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];

    const inventoryItem: InventoryItem = {
      id: generateId(),
      itemId: randomItem.id,
      quantity: 1,
      sourceSignature: `gacha_${Date.now()}`,
      collectedAt: Date.now(),
      isLocked: false,
    };
    await this.db.addInventoryItem(inventoryItem);

    return { itemId: randomItem.id, rarity, isPity };
  }

  private isRarityAtOrAbove(rarity: ItemRarity, target: ItemRarity): boolean {
    const order: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];
    return order.indexOf(rarity) >= order.indexOf(target);
  }

  async getPity(poolId: string): Promise<GachaPity> {
    return await this.db.getGachaPity(poolId);
  }
}