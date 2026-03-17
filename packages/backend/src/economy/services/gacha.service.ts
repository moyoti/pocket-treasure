import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GachaPool, GachaPoolItem } from '../entities/gacha-pool.entity';
import { GachaRecord } from '../entities/gacha-record.entity';
import { User } from '../../user/entities/user.entity';
import { Item, ItemRarity } from '../../item/entities/item.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { CoinService } from './coin.service';
import { CoinTransactionSource } from '../entities/coin-transaction.entity';
import { PullGachaDto, PullType } from '../dto/pull-gacha.dto';

// Default gacha pool
const DEFAULT_GACHA_POOLS: Partial<GachaPool>[] = [
  {
    name: '标准抽奖池',
    description: '标准宝藏抽奖池，10抽保底稀有及以上',
    singlePrice: 100,
    tenPrice: 900,
    pityThreshold: 10,
    pityMinRarity: 'rare',
    items: [
      { rarity: 'common', weight: 60 },
      { rarity: 'rare', weight: 30 },
      { rarity: 'epic', weight: 8 },
      { rarity: 'legendary', weight: 2 },
    ],
  },
  {
    name: '限定抽奖池',
    description: '限时限定抽奖池，更高概率获得稀有物品',
    singlePrice: 150,
    tenPrice: 1350,
    pityThreshold: 10,
    pityMinRarity: 'epic',
    items: [
      { rarity: 'common', weight: 40 },
      { rarity: 'rare', weight: 35 },
      { rarity: 'epic', weight: 20 },
      { rarity: 'legendary', weight: 5 },
    ],
  },
];

// Rarity order for pity comparison
const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

export interface GachaPullResult {
  success: boolean;
  pool: GachaPool;
  pullType: PullType;
  results: {
    item: Item;
    rarity: string;
    isPity: boolean;
  }[];
  coinsSpent: number;
  newCoinBalance: number;
  newPityCount: number;
}

@Injectable()
export class GachaService {
  private readonly logger = new Logger(GachaService.name);

  constructor(
    @InjectRepository(GachaPool)
    private gachaPoolRepository: Repository<GachaPool>,
    @InjectRepository(GachaRecord)
    private gachaRecordRepository: Repository<GachaRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    private coinService: CoinService,
  ) {}

  /**
   * Initialize default gacha pools
   */
  async initializePools(): Promise<void> {
    const count = await this.gachaPoolRepository.count();
    if (count === 0) {
      this.logger.log('Initializing default gacha pools...');
      for (const poolData of DEFAULT_GACHA_POOLS) {
        const pool = this.gachaPoolRepository.create(poolData);
        await this.gachaPoolRepository.save(pool);
      }
      this.logger.log('Default gacha pools initialized');
    }
  }

  /**
   * Get all gacha pools
   */
  async getPools(): Promise<GachaPool[]> {
    await this.initializePools();
    return this.gachaPoolRepository.find({
      where: { isActive: true },
    });
  }

  /**
   * Get user's pity count for a pool
   */
  async getPityCount(userId: string, poolId: string): Promise<number> {
    const lastPityOrHighRarity = await this.gachaRecordRepository.findOne({
      where: { userId, poolId },
      order: { createdAt: 'DESC' },
    });

    if (!lastPityOrHighRarity) {
      return 0;
    }

    // If last pull was pity or high rarity, reset count
    if (lastPityOrHighRarity.isPity || this.isHighRarity(lastPityOrHighRarity.itemRarity, 'epic')) {
      return 0;
    }

    return lastPityOrHighRarity.pityCount;
  }

  /**
   * Perform gacha pull
   */
  async pull(userId: string, dto: PullGachaDto): Promise<GachaPullResult> {
    await this.initializePools();

    const { poolId, pullType = PullType.SINGLE } = dto;

    // Get pool
    const pool = await this.gachaPoolRepository.findOne({
      where: { id: poolId, isActive: true },
    });

    if (!pool) {
      throw new NotFoundException('Gacha pool not found');
    }

    // Calculate cost
    const pullCount = pullType === PullType.TEN ? 10 : 1;
    const cost = pullType === PullType.TEN ? pool.tenPrice : pool.singlePrice;

    // Check if user has enough coins
    const hasEnoughCoins = await this.coinService.hasEnoughCoins(userId, cost);
    if (!hasEnoughCoins) {
      throw new BadRequestException(`Insufficient coins. Required: ${cost}`);
    }

    // Spend coins first (has its own transaction)
    const coinResult = await this.coinService.spendCoins(
      userId,
      cost,
      CoinTransactionSource.GACHA,
      `Gacha pull: ${pullType} from ${pool.name}`,
    );

    // Use transaction for gacha pulls
    return await this.gachaRecordRepository.manager.transaction(async (manager) => {
      // Get current pity count
      let pityCount = await this.getPityCount(userId, poolId);

      // Perform pulls
      const results: { item: Item; rarity: string; isPity: boolean }[] = [];

      for (let i = 0; i < pullCount; i++) {
        pityCount++;

        // Check if pity should trigger
        const shouldPity = pityCount >= pool.pityThreshold;
        let selectedRarity: string;

        if (shouldPity) {
          // Pity: select minimum rarity or higher
          selectedRarity = this.selectRarityWithMin(pool.items, pool.pityMinRarity);
          pityCount = 0; // Reset pity
        } else {
          // Normal selection
          selectedRarity = this.selectRarity(pool.items);
        }

        // Get random item of selected rarity
        const items = await this.getItemsByRarity(selectedRarity);
        const randomItem = items.length > 0
          ? items[Math.floor(Math.random() * items.length)]
          : null;

        if (randomItem) {
          results.push({
            item: randomItem,
            rarity: selectedRarity,
            isPity: shouldPity,
          });

          // Add to inventory
          await this.addItemToInventory(userId, randomItem, 1, manager);

          // Reset pity if high rarity obtained
          if (this.isHighRarity(selectedRarity, pool.pityMinRarity) && !shouldPity) {
            pityCount = 0;
          }
        }

        // Record gacha result
        const record = manager.create(GachaRecord, {
          userId,
          poolId,
          itemRarity: selectedRarity,
          itemId: randomItem?.id,
          isPity: shouldPity,
          pityCount,
          pullType,
          cost: pullType === PullType.TEN ? pool.tenPrice / 10 : pool.singlePrice,
        });
        await manager.save(record);
      }

      this.logger.log(`User ${userId} pulled ${pullType} from ${pool.name}. Results: ${results.map(r => r.item.name).join(', ')}`);

      return {
        success: true,
        pool,
        pullType,
        results,
        coinsSpent: cost,
        newCoinBalance: coinResult.newBalance,
        newPityCount: pityCount,
      };
    });
  }

  /**
   * Get user's gacha history
   */
  async getHistory(userId: string, poolId?: string, limit: number = 20): Promise<GachaRecord[]> {
    const query = this.gachaRecordRepository.createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .leftJoinAndSelect('record.pool', 'pool')
      .orderBy('record.createdAt', 'DESC')
      .limit(limit);

    if (poolId) {
      query.andWhere('record.poolId = :poolId', { poolId });
    }

    return query.getMany();
  }

  /**
   * Select rarity based on weights
   */
  private selectRarity(items: GachaPoolItem[]): string {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.rarity;
      }
    }

    return items[items.length - 1].rarity;
  }

  /**
   * Select rarity with minimum guarantee
   */
  private selectRarityWithMin(items: GachaPoolItem[], minRarity: string): string {
    // Filter items that meet minimum rarity
    const eligibleItems = items.filter(item =>
      this.isHighRarity(item.rarity, minRarity)
    );

    if (eligibleItems.length === 0) {
      return minRarity;
    }

    return this.selectRarity(eligibleItems);
  }

  /**
   * Check if rarity is at or above the threshold
   */
  private isHighRarity(rarity: string, threshold: string): boolean {
    const rarityIndex = RARITY_ORDER.indexOf(rarity);
    const thresholdIndex = RARITY_ORDER.indexOf(threshold);
    return rarityIndex >= thresholdIndex;
  }

  /**
   * Get items by rarity
   */
  private async getItemsByRarity(rarity: string): Promise<Item[]> {
    return this.itemRepository.find({
      where: { rarity: rarity as ItemRarity },
    });
  }

  /**
   * Add item to inventory
   */
  private async addItemToInventory(
    userId: string,
    item: Item,
    quantity: number,
    manager: any,
  ): Promise<void> {
    let inventoryItem = await manager.findOne(InventoryItem, {
      where: { userId, itemId: item.id },
    });

    if (inventoryItem) {
      const newQuantity = Math.min(inventoryItem.quantity + quantity, item.maxStack);
      inventoryItem.quantity = newQuantity;
      await manager.save(inventoryItem);
    } else {
      inventoryItem = manager.create(InventoryItem, {
        userId,
        itemId: item.id,
        item,
        quantity,
        collectedLatitude: 0,
        collectedLongitude: 0,
        poiName: 'Gacha Reward',
      });
      await manager.save(inventoryItem);
    }
  }
}