import * as ed25519 from '@noble/ed25519';
import {
  TradeOffer,
  TradeRecord,
  InventoryItem,
  ItemDefinition,
  TradeStatus,
} from '../types';
import { identityService } from '../identity/IdentityService';
import { databaseService } from '../database';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface TradeExecutionContext {
  offerId: string;
  myPublicKey: string;
  partnerPublicKey: string;
  myOffer: TradeOffer;
  partnerOffer: TradeOffer;
  myItems: InventoryItem[];
  partnerItems: InventoryItem[];
}

export class TradeEngine {
  async validateOffer(offer: TradeOffer, inventory: InventoryItem[]): Promise<ValidationResult> {
    if (!offer.offererPublicKey) {
      return { isValid: false, error: 'Missing offerer public key' };
    }

    if (!offer.offeredItems || offer.offeredItems.length === 0) {
      return { isValid: false, error: 'No items offered' };
    }

    for (const offeredItem of offer.offeredItems) {
      const inventoryItem = inventory.find(i => i.id === offeredItem.inventoryId);
      if (!inventoryItem) {
        return { isValid: false, error: `Item ${offeredItem.inventoryId} not in inventory` };
      }

      if (inventoryItem.isLocked) {
        return { isValid: false, error: `Item ${offeredItem.inventoryId} is locked` };
      }

      if (inventoryItem.quantity < offeredItem.quantity) {
        return { isValid: false, error: `Insufficient quantity for item ${offeredItem.inventoryId}` };
      }
    }

    const now = Date.now();
    if (offer.expiresAt < now) {
      return { isValid: false, error: 'Offer has expired' };
    }

    return { isValid: true };
  }

  async validateTrade(context: TradeExecutionContext): Promise<ValidationResult> {
    const myInventory = await databaseService.getInventory();
    const myValidation = await this.validateOffer(context.myOffer, myInventory);
    if (!myValidation.isValid) {
      return { isValid: false, error: `My offer invalid: ${myValidation.error}` };
    }

    return { isValid: true };
  }

  async generateTradeSignature(context: TradeExecutionContext): Promise<string> {
    const tradeData = this.serializeTradeData(context);
    const privateKey = await identityService.getPrivateKey();
    
    if (!privateKey) {
      throw new Error('No private key available');
    }

    const tradeDataBytes = new TextEncoder().encode(tradeData);
    const hashBuffer = await crypto.subtle.digest('SHA-512', tradeDataBytes);
    const hash = new Uint8Array(hashBuffer);
    const signature = await ed25519.signAsync(hash, privateKey);
    
    return this.bytesToHex(signature);
  }

  async verifyTradeSignature(
    signature: string,
    tradeData: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const signatureBytes = this.hexToBytes(signature);
      const publicKeyBytes = this.hexToBytes(publicKey);
      const tradeDataBytes = new TextEncoder().encode(tradeData);
      const hashBuffer = await crypto.subtle.digest('SHA-512', tradeDataBytes);
      const hash = new Uint8Array(hashBuffer);

      return await ed25519.verifyAsync(signatureBytes, hash, publicKeyBytes);
    } catch {
      return false;
    }
  }

  private serializeTradeData(context: TradeExecutionContext): string {
    const data = {
      offerId: context.offerId,
      myPublicKey: context.myPublicKey,
      partnerPublicKey: context.partnerPublicKey,
      myItems: context.myOffer.offeredItems.map(i => ({
        inventoryId: i.inventoryId,
        itemId: i.itemId,
        quantity: i.quantity,
      })),
      partnerItems: context.partnerOffer.offeredItems.map(i => ({
        inventoryId: i.inventoryId,
        itemId: i.itemId,
        quantity: i.quantity,
      })),
      timestamp: Date.now(),
    };

    return JSON.stringify(data);
  }

  async executeTrade(context: TradeExecutionContext, mySignature: string, partnerSignature?: string): Promise<TradeRecord> {
    const validation = await this.validateTrade(context);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Trade validation failed');
    }

    await this.lockItems(context.myOffer.offeredItems.map(i => i.inventoryId));

    for (const offeredItem of context.myOffer.offeredItems) {
      await this.transferItemOut(offeredItem.inventoryId, offeredItem.quantity);
    }

    for (const receivedItem of context.partnerOffer.offeredItems) {
      await this.transferItemIn(receivedItem);
    }

    await this.unlockItems(context.myOffer.offeredItems.map(i => i.inventoryId));

    const tradeRecord: TradeRecord = {
      id: context.offerId,
      partnerPublicKey: context.partnerPublicKey,
      partnerDisplayName: context.partnerOffer.offererDisplayName,
      itemsGiven: context.myOffer.offeredItems.map(i => i.inventoryId),
      itemsReceived: context.partnerOffer.offeredItems.map(i => i.inventoryId),
      mySignature,
      partnerSignature,
      tradeStatus: 'completed',
      tradedAt: Date.now(),
    };

    await databaseService.addTradeRecord(tradeRecord);

    return tradeRecord;
  }

  private async lockItems(inventoryIds: string[]): Promise<void> {
    for (const id of inventoryIds) {
      await databaseService.setItemLocked(id, true);
    }
  }

  private async unlockItems(inventoryIds: string[]): Promise<void> {
    for (const id of inventoryIds) {
      await databaseService.setItemLocked(id, false);
    }
  }

  private async transferItemOut(inventoryId: string, quantity: number): Promise<void> {
    const item = await databaseService.getInventoryByItem(inventoryId);
    const targetItem = item.find(i => i.id === inventoryId);

    if (!targetItem) {
      throw new Error(`Item ${inventoryId} not found`);
    }

    const newQuantity = targetItem.quantity - quantity;
    await databaseService.updateInventoryQuantity(inventoryId, newQuantity);
  }

  private async transferItemIn(receivedItem: { inventoryId: string; itemId: string; quantity: number }): Promise<void> {
    const existingItems = await databaseService.getInventoryByItem(receivedItem.itemId);
    
    if (existingItems.length > 0) {
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + receivedItem.quantity;
      await databaseService.updateInventoryQuantity(existingItem.id, newQuantity);
    } else {
      const newInventoryItem: InventoryItem = {
        id: `${receivedItem.itemId}_${Date.now()}`,
        itemId: receivedItem.itemId,
        quantity: receivedItem.quantity,
        sourceSignature: receivedItem.inventoryId,
        sourcePoiId: undefined,
        collectedAt: Date.now(),
        parentId: receivedItem.inventoryId,
        isLocked: false,
      };
      await databaseService.addInventoryItem(newInventoryItem);
    }
  }

  async cancelTrade(context: TradeExecutionContext): Promise<void> {
    await this.unlockItems(context.myOffer.offeredItems.map(i => i.inventoryId));

    const tradeRecord: TradeRecord = {
      id: context.offerId,
      partnerPublicKey: context.partnerPublicKey,
      partnerDisplayName: context.partnerOffer.offererDisplayName,
      itemsGiven: [],
      itemsReceived: [],
      mySignature: '',
      partnerSignature: undefined,
      tradeStatus: 'cancelled',
      tradedAt: Date.now(),
    };

    await databaseService.addTradeRecord(tradeRecord);
  }

  async getTradeableItems(): Promise<InventoryItem[]> {
    const inventory = await databaseService.getInventory();
    return inventory.filter(item => !item.isLocked);
  }

  async createOffer(inventoryItems: InventoryItem[], selectedItems: { inventoryId: string; quantity: number }[]): Promise<TradeOffer> {
    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const offeredItems = selectedItems.map(sel => {
      const item = inventoryItems.find(i => i.id === sel.inventoryId);
      if (!item) {
        throw new Error(`Item ${sel.inventoryId} not found`);
      }
      return {
        inventoryId: sel.inventoryId,
        itemId: item.itemId,
        quantity: sel.quantity,
      };
    });

    const offerId = `${identity.publicKey}_${Date.now()}`;

    return {
      offerId,
      offererPublicKey: identity.publicKey,
      offererDisplayName: identity.displayName,
      offeredItems,
      requestedItems: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    };
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }
}

export const tradeEngine = new TradeEngine();