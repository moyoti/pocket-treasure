import { DatabaseService } from '../database/DatabaseService';
import { InventoryItem, ItemRarity } from '../types';
import { getItemById } from '../data/items';

export const SELL_PRICES: Record<ItemRarity, number> = {
  common: 10,
  rare: 50,
  epic: 200,
  legendary: 1000,
};

export interface SellResult {
  success: boolean;
  error?: string;
  coinsEarned?: number;
  soldItem?: {
    itemId: string;
    itemName: string;
    rarity: ItemRarity;
    quantity: number;
  };
}

export class SellEngine {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  getSellPrice(itemId: string): number {
    const item = getItemById(itemId);
    if (!item) return 0;
    return SELL_PRICES[item.rarity];
  }

  async sellItem(inventoryItemId: string): Promise<SellResult> {
    const inventory = await this.db.getInventory();
    const item = inventory.find(i => i.id === inventoryItemId);

    if (!item) {
      return { success: false, error: 'Item not found in inventory' };
    }

    if (item.isLocked) {
      return { success: false, error: 'Item is locked and cannot be sold' };
    }

    const itemDef = getItemById(item.itemId);
    if (!itemDef) {
      return { success: false, error: 'Item definition not found' };
    }

    const sellPrice = SELL_PRICES[itemDef.rarity] * item.quantity;

    await this.db.removeInventoryItem(inventoryItemId);
    await this.db.addCoins(sellPrice);

    return {
      success: true,
      coinsEarned: sellPrice,
      soldItem: {
        itemId: item.itemId,
        itemName: itemDef.name,
        rarity: itemDef.rarity,
        quantity: item.quantity,
      },
    };
  }

  async sellItems(inventoryItemIds: string[]): Promise<SellResult> {
    const inventory = await this.db.getInventory();
    const itemsToSell = inventory.filter(i => inventoryItemIds.includes(i.id));

    if (itemsToSell.length === 0) {
      return { success: false, error: 'No items found to sell' };
    }

    const lockedItems = itemsToSell.filter(i => i.isLocked);
    if (lockedItems.length > 0) {
      return { success: false, error: `${lockedItems.length} items are locked and cannot be sold` };
    }

    let totalCoins = 0;
    const soldItems: Array<{ itemId: string; itemName: string; rarity: ItemRarity; quantity: number }> = [];

    for (const item of itemsToSell) {
      const itemDef = getItemById(item.itemId);
      if (!itemDef) continue;

      const sellPrice = SELL_PRICES[itemDef.rarity] * item.quantity;
      totalCoins += sellPrice;

      soldItems.push({
        itemId: item.itemId,
        itemName: itemDef.name,
        rarity: itemDef.rarity,
        quantity: item.quantity,
      });

      await this.db.removeInventoryItem(item.id);
    }

    await this.db.addCoins(totalCoins);

    return {
      success: true,
      coinsEarned: totalCoins,
      soldItem: soldItems[0],
    };
  }

  getRaritySellPrice(rarity: ItemRarity): number {
    return SELL_PRICES[rarity];
  }
}