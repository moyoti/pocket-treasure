import { SpawnedTreasure, POI, ItemDefinition, ItemRarity, TIME_SLOT_DURATION_MS, RARITY_WEIGHTS } from '../types';
import { databaseService } from '../database';
import { ITEM_DEFINITIONS, getItemsByRarity, getTotalSpawnWeight } from '../data/items';
import { identityService } from '../identity';
import { InventoryItem, CollectSignature } from '../types';

const SPAWN_SALT = 'treasure_hunt_spawn_v1';

export class SpawnService {
  private currentTimeSlot(): number {
    return Math.floor(Date.now() / TIME_SLOT_DURATION_MS);
  }

  private timeSlotEndTime(slot: number): number {
    return (slot + 1) * TIME_SLOT_DURATION_MS;
  }

  async getNearbySpawns(
    latitude: number,
    longitude: number,
    radiusMeters: number = 2000
  ): Promise<SpawnedTreasure[]> {
    const pois = await databaseService.getPOIsNearby(latitude, longitude, radiusMeters / 1000);
    
    if (pois.length === 0) {
      return [];
    }

    const currentSlot = this.currentTimeSlot();
    const collectedSlots = await databaseService.getCollectedSlots();
    const collectedSet = new Set(collectedSlots.map(s => `${s.poiId}:${s.timeSlot}`));

    const spawnPromises = pois.map(poi => this.generateSpawnForPOI(poi, currentSlot));
    const spawns = await Promise.all(spawnPromises);

    for (let i = 0; i < spawns.length; i++) {
      spawns[i].isCollected = collectedSet.has(`${pois[i].id}:${currentSlot}`);
    }

    return spawns;
  }

  private async generateSpawnForPOI(poi: POI, timeSlot: number): Promise<SpawnedTreasure> {
    const seedInput = `${poi.latitude.toFixed(6)}:${poi.longitude.toFixed(6)}:${timeSlot}:${SPAWN_SALT}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(seedInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const seedHash = new Uint8Array(hashBuffer);
    const seedNumber = this.hashToNumber(seedHash);

    const itemId = this.selectItemBySeed(seedNumber, poi.spawnWeight);

    return {
      poiId: poi.id,
      itemId,
      timeSlot,
      expiresAt: this.timeSlotEndTime(timeSlot),
      isCollected: false,
    };
  }

  private hashToNumber(hash: Uint8Array): number {
    let result = 0;
    for (let i = 0; i < 8; i++) {
      result = (result * 256 + hash[i]) % 1000000007;
    }
    return result;
  }

  private selectItemBySeed(seed: number, poiWeight: number): string {
    const adjustedWeights = this.calculateAdjustedRarityWeights(seed, poiWeight);
    const rarity = this.selectRarityBySeed(seed, adjustedWeights);
    const itemsOfRarity = getItemsByRarity(rarity);

    if (itemsOfRarity.length === 0) {
      const commons = getItemsByRarity('common');
      return commons[0]?.id || ITEM_DEFINITIONS[0].id;
    }

    const itemIndex = Math.abs(seed) % itemsOfRarity.length;
    return itemsOfRarity[itemIndex].id;
  }

  private calculateAdjustedRarityWeights(
    seed: number,
    poiWeight: number
  ): Record<ItemRarity, number> {
    const weights: Record<ItemRarity, number> = {
      common: RARITY_WEIGHTS.common,
      rare: RARITY_WEIGHTS.rare,
      epic: RARITY_WEIGHTS.epic,
      legendary: RARITY_WEIGHTS.legendary,
    };

    const bonusMultiplier = Math.min(poiWeight, 3.0);
    weights.common = Math.max(weights.common - bonusMultiplier * 2, 50);
    weights.rare += bonusMultiplier;
    weights.epic += bonusMultiplier * 0.5;
    weights.legendary += bonusMultiplier * 0.3;

    return weights;
  }

  private selectRarityBySeed(
    seed: number,
    weights: Record<ItemRarity, number>
  ): ItemRarity {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let remaining = Math.abs(seed) % totalWeight;

    const rarities: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];

    for (const rarity of rarities) {
      remaining -= weights[rarity];
      if (remaining <= 0) {
        return rarity;
      }
    }

    return 'common';
  }

  async collectItem(
    spawn: SpawnedTreasure,
    userLat: number,
    userLng: number
  ): Promise<{ success: boolean; inventoryItem?: InventoryItem; error?: string }> {
    const poi = await databaseService.getPOIById(spawn.poiId);
    
    if (!poi) {
      return { success: false, error: 'POI not found' };
    }

    const distance = this.calculateDistance(userLat, userLng, poi.latitude, poi.longitude);
    const COLLECTION_RADIUS_METERS = 50;

    if (distance > COLLECTION_RADIUS_METERS) {
      return { 
        success: false, 
        error: `Too far: ${Math.round(distance)}m away (need ${COLLECTION_RADIUS_METERS}m)` 
      };
    }

    const alreadyCollected = await databaseService.hasCollectedSlot(spawn.poiId, spawn.timeSlot);
    if (alreadyCollected) {
      return { success: false, error: 'Already collected this slot' };
    }

    const timestamp = Date.now();
    const signatureResult = await identityService.createCollectionSignature(
      spawn.itemId,
      spawn.poiId,
      spawn.timeSlot,
      timestamp
    );

    const inventoryItem: InventoryItem = {
      id: signatureResult.instanceId,
      itemId: spawn.itemId,
      quantity: 1,
      sourceSignature: signatureResult.signature,
      sourcePoiId: spawn.poiId,
      collectedAt: timestamp,
      parentId: undefined,
      isLocked: false,
    };

    await databaseService.addInventoryItem(inventoryItem);
    await databaseService.addCollectedSlot({
      poiId: spawn.poiId,
      timeSlot: spawn.timeSlot,
      collectedAt: timestamp,
    });

    return { success: true, inventoryItem };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async verifyCollectionSignature(
    signature: string,
    itemId: string,
    poiId: string,
    timeSlot: number,
    timestamp: number,
    publicKey: string
  ): Promise<boolean> {
    return await identityService.verifyCollectionSignature(
      signature,
      itemId,
      poiId,
      timeSlot,
      timestamp,
      publicKey
    );
  }

  getTimeSlotProgress(): { currentSlot: number; expiresIn: number } {
    const now = Date.now();
    const currentSlot = this.currentTimeSlot();
    const expiresAt = this.timeSlotEndTime(currentSlot);
    const expiresIn = expiresAt - now;

    return { currentSlot, expiresIn };
  }
}

export const spawnService = new SpawnService();