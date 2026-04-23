import { DatabaseService } from '../database/DatabaseService';
import { CosmeticDefinition, UserCosmetic, CosmeticType } from '../types';
import { COSMETIC_DEFINITIONS, getCosmeticById, getCosmeticsByType } from '../data/cosmetics';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export class CosmeticEngine {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async initialize(): Promise<void> {
    await this.db.seedCosmetics(COSMETIC_DEFINITIONS);
  }

  async getCosmetics(): Promise<CosmeticDefinition[]> {
    return await this.db.getCosmetics();
  }

  async getCosmetic(cosmeticId: string): Promise<CosmeticDefinition | undefined> {
    const cosmetics = await this.getCosmetics();
    return cosmetics.find(c => c.id === cosmeticId);
  }

  async getUserCosmetics(): Promise<UserCosmetic[]> {
    return await this.db.getUserCosmetics();
  }

  async purchaseCosmetic(cosmeticId: string): Promise<{
    success: boolean;
    error?: string;
    cosmetic?: UserCosmetic;
  }> {
    const cosmetic = getCosmeticById(cosmeticId);
    if (!cosmetic) {
      return { success: false, error: 'Cosmetic not found' };
    }

    if (!cosmetic.isActive) {
      return { success: false, error: 'Cosmetic not available' };
    }

    const canSpend = await this.db.spendCoins(cosmetic.price);
    if (!canSpend) {
      return { success: false, error: 'Insufficient coins' };
    }

    const userCosmetics = await this.db.getUserCosmetics();
    const alreadyOwned = userCosmetics.some(uc => uc.cosmeticId === cosmeticId);
    if (alreadyOwned) {
      return { success: false, error: 'Already owned' };
    }

    const userCosmetic = await this.db.addUserCosmetic(cosmeticId, cosmetic.type);

    return { success: true, cosmetic: userCosmetic };
  }

  async equipCosmetic(cosmeticId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const userCosmetics = await this.db.getUserCosmetics();
    const owned = userCosmetics.find(uc => uc.cosmeticId === cosmeticId);

    if (!owned) {
      return { success: false, error: 'Not owned' };
    }

    await this.db.equipCosmetic(cosmeticId);
    return { success: true };
  }

  async unequipCosmetic(cosmeticType: CosmeticType): Promise<void> {
    await this.db.unequipCosmetic(cosmeticType);
  }

  async getEquippedCosmetics(): Promise<UserCosmetic[]> {
    return await this.db.getEquippedCosmetics();
  }

  async getEquippedByType(type: CosmeticType): Promise<UserCosmetic | undefined> {
    const equipped = await this.getEquippedCosmetics();
    return equipped.find(uc => uc.cosmeticType === type);
  }

  async getCosmeticsByType(type: CosmeticType): Promise<CosmeticDefinition[]> {
    return getCosmeticsByType(type);
  }

  async isOwned(cosmeticId: string): Promise<boolean> {
    const userCosmetics = await this.db.getUserCosmetics();
    return userCosmetics.some(uc => uc.cosmeticId === cosmeticId);
  }
}