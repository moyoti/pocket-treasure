import { databaseService } from '../database';
import { ShopItemDefinition, PurchaseRecord, UserProfile } from '../types';
import { SHOP_DEFINITIONS, getShopItemById } from '../data/shop';
import { CHEST_DEFINITIONS } from '../data/chests';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export class ShopEngine {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    await this.db.seedShopItems(SHOP_DEFINITIONS);
  }

  async getShopItems(): Promise<ShopItemDefinition[]> {
    return await this.db.getShopItems();
  }

  async getShopItem(id: string): Promise<ShopItemDefinition | undefined> {
    const items = await this.getShopItems();
    return items.find(item => item.id === id);
  }

  async purchaseItem(shopItemId: string, quantity: number = 1): Promise<{
    success: boolean;
    error?: string;
    profile?: UserProfile;
    rewards?: ShopItemDefinition['rewards'];
  }> {
    const item = await this.getShopItem(shopItemId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (!item.isAvailable) {
      return { success: false, error: 'Item not available' };
    }

    const totalCost = item.price * quantity;
    
    const canSpend = await this.db.spendCoins(totalCost);
    if (!canSpend) {
      return { success: false, error: 'Insufficient coins' };
    }

    const purchaseCount = await this.getPurchaseCount(shopItemId);
    if (item.purchaseLimit > 0 && purchaseCount + quantity > item.purchaseLimit) {
      return { success: false, error: 'Purchase limit reached' };
    }

    const record: PurchaseRecord = {
      id: generateId(),
      shopItemId,
      quantity,
      coinsSpent: totalCost,
      purchasedAt: Date.now(),
    };
    await this.db.addPurchaseRecord(record);

    await this.applyRewards(item.rewards, quantity);

    const profile = await this.db.getUserProfile();
    return { success: true, profile: profile!, rewards: item.rewards };
  }

  private async applyRewards(rewards: ShopItemDefinition['rewards'], quantity: number): Promise<void> {
    if (rewards.coins) {
      await this.db.addCoins(rewards.coins * quantity);
    }
    if (rewards.experience) {
      const profile = await this.db.getUserProfile();
      if (profile) {
        await this.db.updateUserProfile({ experience: profile.experience + rewards.experience * quantity });
      }
    }
    if (rewards.chestType) {
      const chest = CHEST_DEFINITIONS.find(c => c.id === rewards.chestType);
      if (chest) {
        await this.db.addUserChest(chest.id, quantity);
      }
    }
  }

  private async getPurchaseCount(shopItemId: string): Promise<number> {
    return 0;
  }

  async getPurchaseHistory(): Promise<PurchaseRecord[]> {
    return [];
  }
}