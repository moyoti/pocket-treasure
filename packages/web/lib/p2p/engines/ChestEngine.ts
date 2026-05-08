import { databaseService } from '../database';
import { ChestDefinition, UserChest, InventoryItem, ItemRarity } from '../types';
import { CHEST_DEFINITIONS, getChestById, rollChestRarity, getChestItemCount } from '../data/chests';
import { getItemsByRarity } from '../data/items';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export class ChestEngine {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    await this.db.seedChests(CHEST_DEFINITIONS);
  }

  async getUserChests(): Promise<UserChest[]> {
    return await this.db.getUserChests();
  }

  async getChest(chestId: string): Promise<ChestDefinition | undefined> {
    return getChestById(chestId);
  }

  async openChest(chestId: string): Promise<{
    success: boolean;
    error?: string;
    items: Array<{ itemId: string; rarity: ItemRarity; quantity: number }>;
  }> {
    const chest = getChestById(chestId);
    if (!chest) {
      return { success: false, error: 'Chest not found', items: [] };
    }

    const userChests = await this.db.getUserChests();
    const userChest = userChests.find(uc => uc.chestId === chestId);

    if (!userChest || userChest.quantity <= 0) {
      return { success: false, error: 'No chests available', items: [] };
    }

    if (chest.openCost > 0) {
      const canSpend = await this.db.spendCoins(chest.openCost);
      if (!canSpend) {
        return { success: false, error: 'Insufficient coins to open', items: [] };
      }
    }

    await this.db.removeUserChest(chestId, 1);

    const itemCount = getChestItemCount(chest);
    const items: Array<{ itemId: string; rarity: ItemRarity; quantity: number }> = [];

    for (let i = 0; i < itemCount; i++) {
      const rarity = rollChestRarity(chest);
      const itemsOfRarity = getItemsByRarity(rarity);
      const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];

      const inventoryItem: InventoryItem = {
        id: generateId(),
        itemId: randomItem.id,
        quantity: 1,
        sourceSignature: `chest_${chestId}_${Date.now()}`,
        collectedAt: Date.now(),
        isLocked: false,
      };
      await this.db.addInventoryItem(inventoryItem);

      const existing = items.find(item => item.itemId === randomItem.id);
      if (existing) {
        existing.quantity++;
      } else {
        items.push({ itemId: randomItem.id, rarity, quantity: 1 });
      }
    }

    return { success: true, items };
  }

  async addChest(chestId: string, quantity: number = 1): Promise<void> {
    await this.db.addUserChest(chestId, quantity);
  }

  async getChestCount(chestId: string): Promise<number> {
    const userChests = await this.db.getUserChests();
    const userChest = userChests.find(uc => uc.chestId === chestId);
    return userChest?.quantity || 0;
  }
}