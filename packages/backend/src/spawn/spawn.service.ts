import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SpawnedItem } from './entities/spawned-item.entity';
import { ItemService } from '../item/item.service';
import { PoiService } from '../poi/poi.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventService } from '../event/event.service';
import { UserService } from '../user/user.service';
import { CollectItemDto } from './dto/collect-item.dto';
import { Item, ItemRarity } from '../item/entities/item.entity';
import { POI, PoiType } from '../poi/entities/poi.entity';
import {
  COLLECTION_RADIUS_METERS,
  FIXED_RARITY_WEIGHTS,
  TIME_BONUS_CONFIGS,
  WEEKEND_BONUS,
  LUCKY_VALUE_CONFIG,
  SPAWN_CONFIG,
  TimeBonus,
} from '@treasure-hunt/shared';

interface SpawnContext {
  poiType?: PoiType;
  luckyPoints?: number;
  userId?: string;
}

@Injectable()
export class SpawnService implements OnModuleInit {
  private readonly logger = new Logger(SpawnService.name);

  constructor(
    @InjectRepository(SpawnedItem)
    private spawnedItemRepository: Repository<SpawnedItem>,
    private itemService: ItemService,
    private poiService: PoiService,
    private inventoryService: InventoryService,
    private eventService: EventService,
    private userService: UserService,
  ) {}

  async onModuleInit() {
    // 启动时自动生成宝藏
    const count = await this.spawnedItemRepository.count();
    if (count === 0) {
      this.logger.log('No spawned items found, generating initial items...');
      try {
        await this.scheduledSpawn();
        this.logger.log('Initial items generated successfully');
      } catch (error) {
        this.logger.error('Failed to generate initial items', error);
      }
    }
  }

  /**
   * Scheduled spawn: Every 4 hours
   */
  @Cron('0 0 */4 * * *')  // Every 4 hours
  async handleScheduledSpawn() {
    this.logger.log('Starting scheduled item spawn...');
    try {
      const result = await this.scheduledSpawn();
      this.logger.log(`Scheduled spawn completed: ${result.length} items spawned`);
    } catch (error) {
      this.logger.error('Scheduled spawn failed', error);
    }
  }

  /**
   * Main scheduled spawn logic
   */
  async scheduledSpawn(): Promise<SpawnedItem[]> {
    const now = new Date();
    const timeBonus = this.getCurrentTimeBonus(now);
    const eventQuantityMultiplier = await this.eventService.getCombinedQuantityMultiplier();
    const eventLegendaryBonus = await this.eventService.getLegendaryRateBonus();

    // Get active POIs with weights
    const pois = await this.poiService.getPoisForSpawn(100);

    if (pois.length === 0) {
      this.logger.warn('No active POIs found for spawning');
      return [];
    }

    const spawnedItems: SpawnedItem[] = [];
    const specialItems = await this.eventService.getActiveSpecialItems();

    for (const poi of pois) {
      // Calculate items to spawn for this POI
      const baseCount = Math.ceil(SPAWN_CONFIG.baseItemsPerPoi * Number(poi.spawnWeight));
      let itemCount = Math.ceil(baseCount * timeBonus.quantityMultiplier * eventQuantityMultiplier);

      // Weekend bonus
      if (this.isWeekend(now)) {
        itemCount = Math.ceil(itemCount * WEEKEND_BONUS.quantityMultiplier);
      }

      for (let i = 0; i < itemCount; i++) {
        const item = await this.selectItemWithBonuses({
          poiType: poi.poiType as PoiType,
          timeBonus,
          eventLegendaryBonus,
          specialItems,
        });

        if (item) {
          const spawnedItem = await this.spawnItemAtPoi(item, poi);
          spawnedItems.push(spawnedItem);
        }
      }
    }

    this.logger.log(`Spawned ${spawnedItems.length} items at ${pois.length} POIs`);
    return spawnedItems;
  }

  /**
   * User-triggered spawn when nearby items are insufficient
   */
  async userTriggeredSpawn(
    latitude: number,
    longitude: number,
    userId: string,
  ): Promise<SpawnedItem[]> {
    // Check current nearby items count
    const nearbyCount = await this.countNearbySpawnedItems(latitude, longitude);

    if (nearbyCount >= SPAWN_CONFIG.minNearbyItemsThreshold) {
      this.logger.debug(`Sufficient items nearby (${nearbyCount}), skipping user spawn`);
      return [];
    }

    // Get user's lucky points
    const user = await this.userService.findById(userId);
    const luckyPoints = user?.luckyPoints || 0;

    // Get nearby POIs
    const nearbyPois = await this.poiService.getNearbyPois(
      latitude,
      longitude,
      SPAWN_CONFIG.userTriggeredRadiusKm,
    );

    if (nearbyPois.length === 0) {
      // Spawn at random locations if no POIs nearby
      return this.spawnAtRandomLocations(latitude, longitude, luckyPoints, userId);
    }

    const itemsToSpawn = Math.min(
      SPAWN_CONFIG.userTriggeredMaxItems,
      SPAWN_CONFIG.minNearbyItemsThreshold - nearbyCount,
    );

    const spawnedItems: SpawnedItem[] = [];
    const now = new Date();
    const timeBonus = this.getCurrentTimeBonus(now);
    const eventLegendaryBonus = await this.eventService.getLegendaryRateBonus();
    const specialItems = await this.eventService.getActiveSpecialItems();

    for (let i = 0; i < itemsToSpawn; i++) {
      const poi = nearbyPois[Math.floor(Math.random() * nearbyPois.length)];
      const item = await this.selectItemWithBonuses({
        poiType: poi.poiType as PoiType,
        luckyPoints,
        timeBonus,
        eventLegendaryBonus,
        specialItems,
      });

      if (item) {
        const spawnedItem = await this.spawnItemAtPoi(item, poi);
        spawnedItems.push(spawnedItem);
      }
    }

    this.logger.log(`User-triggered spawn: ${spawnedItems.length} items for user ${userId}`);
    return spawnedItems;
  }

  /**
   * Spawn items at random locations (when no POIs nearby)
   */
  private async spawnAtRandomLocations(
    latitude: number,
    longitude: number,
    luckyPoints: number,
    userId: string,
  ): Promise<SpawnedItem[]> {
    const itemsToSpawn = SPAWN_CONFIG.userTriggeredMaxItems;
    const spawnedItems: SpawnedItem[] = [];

    const now = new Date();
    const timeBonus = this.getCurrentTimeBonus(now);
    const eventLegendaryBonus = await this.eventService.getLegendaryRateBonus();
    const specialItems = await this.eventService.getActiveSpecialItems();

    for (let i = 0; i < itemsToSpawn; i++) {
      const item = await this.selectItemWithBonuses({
        luckyPoints,
        timeBonus,
        eventLegendaryBonus,
        specialItems,
      });

      if (item) {
        const offset = this.getRandomOffset(500); // 500m radius
        const spawnedItem = this.spawnedItemRepository.create({
          latitude: latitude + offset.lat,
          longitude: longitude + offset.lng,
          item,
          itemId: item.id,
          isActive: true,
          expiresAt: this.getExpirationDate(),
          poiLatitude: latitude,
          poiLongitude: longitude,
          poiName: '探索发现',
        });
        spawnedItems.push(await this.spawnedItemRepository.save(spawnedItem));
      }
    }

    return spawnedItems;
  }

  /**
   * Select item with all bonuses applied
   */
  private async selectItemWithBonuses(context: {
    poiType?: PoiType;
    luckyPoints?: number;
    timeBonus?: TimeBonus;
    eventLegendaryBonus?: number;
    specialItems?: string[];
  }): Promise<Item | null> {
    // Calculate adjusted rarity weights
    const adjustedWeights = this.calculateAdjustedRarityWeights(
      context.timeBonus?.rarityBonus || 0,
      context.luckyPoints || 0,
      context.eventLegendaryBonus || 0,
    );

    // Select rarity first
    const rarity = this.selectRarityByWeight(adjustedWeights);

    // Get special items if available and this is an event
    if (context.specialItems && context.specialItems.length > 0 && Math.random() < 0.1) {
      // 10% chance for special event item
      const specialItemId = context.specialItems[Math.floor(Math.random() * context.specialItems.length)];
      try {
        return await this.itemService.findById(specialItemId);
      } catch {
        // Fall through to normal selection
      }
    }

    // Get items of selected rarity
    const items = await this.itemService.findByRarity(rarity);
    if (items.length === 0) {
      // Fallback to any item
      return this.itemService.getRandomItemByWeight();
    }

    // Random item from the rarity pool
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Calculate adjusted rarity weights with all bonuses
   */
  private calculateAdjustedRarityWeights(
    timeRarityBonus: number,
    luckyPoints: number,
    eventLegendaryBonus: number,
  ): Record<ItemRarity, number> {
    // Start with base weights, converting from shared type keys to backend ItemRarity enum
    const baseWeights: Record<ItemRarity, number> = {
      [ItemRarity.COMMON]: FIXED_RARITY_WEIGHTS.common,
      [ItemRarity.RARE]: FIXED_RARITY_WEIGHTS.rare,
      [ItemRarity.EPIC]: FIXED_RARITY_WEIGHTS.epic,
      [ItemRarity.LEGENDARY]: FIXED_RARITY_WEIGHTS.legendary,
    };

    // Apply time bonus (increases rare+ chances)
    if (timeRarityBonus > 0) {
      // Take from common and distribute to rare+
      const bonusFromCommon = Math.min(baseWeights[ItemRarity.COMMON] * (timeRarityBonus / 100), baseWeights[ItemRarity.COMMON] * 0.2);
      baseWeights[ItemRarity.COMMON] -= bonusFromCommon;
      baseWeights[ItemRarity.RARE] += bonusFromCommon * 0.5;
      baseWeights[ItemRarity.EPIC] += bonusFromCommon * 0.3;
      baseWeights[ItemRarity.LEGENDARY] += bonusFromCommon * 0.2;
    }

    // Apply weekend bonus
    if (this.isWeekend(new Date())) {
      const weekendBonus = WEEKEND_BONUS.rarityBonus;
      const bonusFromCommon = Math.min(baseWeights[ItemRarity.COMMON] * (weekendBonus / 100), baseWeights[ItemRarity.COMMON] * 0.1);
      baseWeights[ItemRarity.COMMON] -= bonusFromCommon;
      baseWeights[ItemRarity.RARE] += bonusFromCommon * 0.5;
      baseWeights[ItemRarity.EPIC] += bonusFromCommon * 0.3;
      baseWeights[ItemRarity.LEGENDARY] += bonusFromCommon * 0.2;
    }

    // Apply lucky points
    if (luckyPoints > 0) {
      const luckyBonus = luckyPoints * LUCKY_VALUE_CONFIG.rarityBonusPerPoint;
      const bonusFromCommon = Math.min(baseWeights[ItemRarity.COMMON] * (luckyBonus / 100), baseWeights[ItemRarity.COMMON] * 0.15);
      baseWeights[ItemRarity.COMMON] -= bonusFromCommon;
      baseWeights[ItemRarity.RARE] += bonusFromCommon * 0.5;
      baseWeights[ItemRarity.EPIC] += bonusFromCommon * 0.3;
      baseWeights[ItemRarity.LEGENDARY] += bonusFromCommon * 0.2;
    }

    // Apply event legendary bonus
    if (eventLegendaryBonus > 0) {
      baseWeights[ItemRarity.LEGENDARY] *= (1 + eventLegendaryBonus / 100);
    }

    return baseWeights;
  }

  /**
   * Select rarity based on weights
   */
  private selectRarityByWeight(weights: Record<ItemRarity, number>): ItemRarity {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    const rarities: ItemRarity[] = [ItemRarity.COMMON, ItemRarity.RARE, ItemRarity.EPIC, ItemRarity.LEGENDARY];

    for (const rarity of rarities) {
      random -= weights[rarity];
      if (random <= 0) {
        return rarity;
      }
    }

    return ItemRarity.COMMON;
  }

  /**
   * Get current time bonus
   */
  private getCurrentTimeBonus(now: Date): TimeBonus {
    const hour = now.getHours();

    for (const config of TIME_BONUS_CONFIGS) {
      if (hour >= config.startHour && hour < config.endHour) {
        return {
          name: config.name,
          nameZh: config.nameZh,
          rarityBonus: config.rarityBonus,
          quantityMultiplier: config.quantityMultiplier,
          legendaryMultiplier: (config as any).legendaryMultiplier,
        };
      }
    }

    return {
      name: 'normal',
      nameZh: '普通时段',
      rarityBonus: 0,
      quantityMultiplier: 1,
    };
  }

  /**
   * Check if it's weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Spawn item at a POI
   */
  private async spawnItemAtPoi(item: Item, poi: POI): Promise<SpawnedItem> {
    const offset = this.getRandomOffset(30); // 30m offset from POI center

    const spawnedItem = this.spawnedItemRepository.create({
      latitude: Number(poi.latitude) + offset.lat,
      longitude: Number(poi.longitude) + offset.lng,
      item,
      itemId: item.id,
      isActive: true,
      expiresAt: this.getExpirationDate(),
      poiLatitude: poi.latitude,
      poiLongitude: poi.longitude,
      poiName: poi.name,
    });

    return this.spawnedItemRepository.save(spawnedItem);
  }

  /**
   * Count nearby spawned items
   */
  private async countNearbySpawnedItems(latitude: number, longitude: number): Promise<number> {
    const radiusKm = SPAWN_CONFIG.userTriggeredRadiusKm;
    const latRange = radiusKm / 111.32;
    const lngRange = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));

    return this.spawnedItemRepository
      .createQueryBuilder('si')
      .where('si.isActive = :isActive', { isActive: true })
      .andWhere('si.expiresAt > :now', { now: new Date() })
      .andWhere('si.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latRange,
        maxLat: latitude + latRange,
      })
      .andWhere('si.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngRange,
        maxLng: longitude + lngRange,
      })
      .getCount();
  }

  /**
   * Get nearby spawned items (with user-triggered spawn if needed)
   */
  async getNearbySpawnedItems(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    userId?: string,
  ) {
    // Check if we need user-triggered spawn
    if (userId) {
      const nearbyCount = await this.countNearbySpawnedItems(latitude, longitude);
      if (nearbyCount < SPAWN_CONFIG.minNearbyItemsThreshold) {
        await this.userTriggeredSpawn(latitude, longitude, userId);
      }
    }

    const latRange = radiusKm / 111.32;
    const lngRange = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));

    const items = await this.spawnedItemRepository
      .createQueryBuilder('si')
      .leftJoinAndSelect('si.item', 'item')
      .where('si.isActive = :isActive', { isActive: true })
      .andWhere('si.expiresAt > :now', { now: new Date() })
      .andWhere('si.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latRange,
        maxLat: latitude + latRange,
      })
      .andWhere('si.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngRange,
        maxLng: longitude + lngRange,
      })
      .orderBy('si.createdAt', 'DESC')
      .limit(100)
      .getMany();

    // Return with rarity info only (mystery mechanism)
    return items.map(item => ({
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      itemRarity: item.item.rarity,
      poiName: item.poiName,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Collect an item
   */
  async collectItem(
    userId: string,
    collectDto: CollectItemDto,
  ): Promise<{ success: boolean; item: any; distance: number }> {
    const { spawnedItemId, latitude, longitude } = collectDto;

    this.logger.debug(`User ${userId} attempting to collect item ${spawnedItemId} at (${latitude}, ${longitude})`);

    const spawnedItem = await this.spawnedItemRepository.findOne({
      where: { id: spawnedItemId, isActive: true },
      relations: ['item'],
    });

    if (!spawnedItem) {
      this.logger.warn(`Item ${spawnedItemId} not found or already collected`);
      throw new NotFoundException('Item not found or already collected');
    }

    if (new Date() > spawnedItem.expiresAt) {
      this.logger.warn(`Item ${spawnedItemId} has expired`);
      throw new BadRequestException('Item has expired');
    }

    const distance = this.calculateDistance(
      latitude,
      longitude,
      Number(spawnedItem.latitude),
      Number(spawnedItem.longitude),
    );
    this.logger.debug(`Distance to item: ${distance}m`);

    if (distance > COLLECTION_RADIUS_METERS) {
      this.logger.debug(`User too far from item: ${distance}m > ${COLLECTION_RADIUS_METERS}m`);
      return { success: false, item: spawnedItem.item, distance };
    }

    // Mark item as collected
    spawnedItem.isActive = false;
    await this.spawnedItemRepository.save(spawnedItem);

    // Update POI collect count for heat tracking
    if (spawnedItem.poiLatitude && spawnedItem.poiLongitude) {
      const pois = await this.poiService.getNearbyPois(
        Number(spawnedItem.poiLatitude),
        Number(spawnedItem.poiLongitude),
        0.1, // 100m radius
      );
      if (pois.length > 0) {
        await this.poiService.incrementCollectCount(pois[0].id);
      }
    }

    // Add item to user's inventory
    try {
      await this.inventoryService.addItemToInventory(
        userId,
        spawnedItem.item,
        Number(spawnedItem.latitude),
        Number(spawnedItem.longitude),
        spawnedItem.poiName,
      );
      this.logger.log(`User ${userId} successfully collected item ${spawnedItemId}`);
    } catch (error) {
      this.logger.error(`Failed to add item to inventory for user ${userId}`, error);
      // Restore item state if inventory addition fails
      spawnedItem.isActive = true;
      await this.spawnedItemRepository.save(spawnedItem);
      throw error;
    }

    return { success: true, item: spawnedItem.item, distance };
  }

  /**
   * Cleanup expired items
   */
  async cleanupExpiredItems(): Promise<number> {
    const result = await this.spawnedItemRepository.delete({
      expiresAt: Between(new Date(0), new Date()),
    });
    return result.affected || 0;
  }

  /**
   * Spawn items near location (for testing)
   */
  async spawnItemsNearLocation(
    latitude: number,
    longitude: number,
    count: number = 10,
  ): Promise<SpawnedItem[]> {
    const spawnedItems: SpawnedItem[] = [];

    for (let i = 0; i < count; i++) {
      const item = await this.itemService.getRandomItemByWeight();
      const offset = this.getRandomOffset(500);

      const spawnedItem = this.spawnedItemRepository.create({
        latitude: latitude + offset.lat,
        longitude: longitude + offset.lng,
        item,
        itemId: item.id,
        isActive: true,
        expiresAt: this.getExpirationDate(),
        poiLatitude: latitude,
        poiLongitude: longitude,
        poiName: '测试宝藏点',
      });

      spawnedItems.push(await this.spawnedItemRepository.save(spawnedItem));
    }

    this.logger.log(`Spawned ${spawnedItems.length} items near (${latitude}, ${longitude})`);
    return spawnedItems;
  }

  /**
   * Get current spawn bonuses info
   */
  async getCurrentBonuses(): Promise<{
    timeBonus: TimeBonus;
    isWeekend: boolean;
    activeEvents: number;
  }> {
    const now = new Date();
    return {
      timeBonus: this.getCurrentTimeBonus(now),
      isWeekend: this.isWeekend(now),
      activeEvents: (await this.eventService.getActiveEvents()).length,
    };
  }

  private getExpirationDate(): Date {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date;
  }

  private getRandomOffset(maxMeters: number): { lat: number; lng: number } {
    const metersPerDegree = 111320;
    const randomMeters = Math.random() * maxMeters;
    const angle = Math.random() * 2 * Math.PI;
    return {
      lat: (randomMeters * Math.cos(angle)) / metersPerDegree,
      lng: (randomMeters * Math.sin(angle)) / metersPerDegree,
    };
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
}