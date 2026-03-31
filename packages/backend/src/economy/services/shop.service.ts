import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ShopItem,
  ShopItemCategory,
  ShopItemRewards,
} from '../entities/shop-item.entity';
import { PurchaseRecord } from '../entities/purchase-record.entity';
import { CoinService, CoinTransactionSource } from './coin.service';
import { PurchaseDto } from '../dto/purchase.dto';
import { InventoryService } from '../../inventory/inventory.service';
import { ItemService } from '../../item/item.service';
import { User } from '../../user/entities/user.entity';

// Default shop items (seed data)
const DEFAULT_SHOP_ITEMS: Partial<ShopItem>[] = [
  {
    name: 'Wooden Chest',
    description: 'A simple wooden chest containing common treasures',
    category: ShopItemCategory.CHEST,
    price: 100,
    rewards: { chestType: 'wooden' },
    isAvailable: true,
    purchaseLimit: 3,
    metadata: { dropPool: ['common'], minItems: 1, maxItems: 2 },
  },
  {
    name: 'Iron Chest',
    description: 'A sturdy iron chest with better treasures inside',
    category: ShopItemCategory.CHEST,
    price: 100,
    rewards: { chestType: 'iron' },
    isAvailable: true,
    purchaseLimit: 0, // unlimited
    metadata: { dropPool: ['common', 'rare'], minItems: 1, maxItems: 3 },
  },
  {
    name: 'Golden Chest',
    description: 'A magnificent golden chest filled with rare treasures',
    category: ShopItemCategory.CHEST,
    price: 500,
    rewards: { chestType: 'golden' },
    isAvailable: true,
    purchaseLimit: 0,
    metadata: { dropPool: ['rare', 'epic'], minItems: 2, maxItems: 4 },
  },
  {
    name: 'Lucky Key',
    description: 'A magical key that increases your luck for the next collection',
    category: ShopItemCategory.KEY,
    price: 50,
    rewards: { coins: 0, experience: 10 },
    isAvailable: true,
    purchaseLimit: 5,
    metadata: { luckBonus: 20, duration: 3600 },
  },
  {
    name: 'Experience Potion',
    description: 'A potion that grants 100 experience points',
    category: ShopItemCategory.CONSUMABLE,
    price: 200,
    rewards: { experience: 100 },
    isAvailable: true,
    purchaseLimit: 0,
  },
  {
    name: 'Coin Pouch',
    description: 'A pouch containing 150 coins',
    category: ShopItemCategory.SPECIAL,
    price: 0, // Free daily reward
    rewards: { coins: 150 },
    isAvailable: true,
    purchaseLimit: 1,
    metadata: { dailyReset: true },
  },
];

@Injectable()
export class ShopService implements OnModuleInit {
  private readonly logger = new Logger(ShopService.name);

  constructor(
    @InjectRepository(ShopItem)
    private shopItemRepository: Repository<ShopItem>,
    @InjectRepository(PurchaseRecord)
    private purchaseRecordRepository: Repository<PurchaseRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private coinService: CoinService,
    private inventoryService: InventoryService,
    private itemService: ItemService,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultShopItems();
  }

  /**
   * Initialize default shop items
   */
  private async initializeDefaultShopItems(): Promise<void> {
    const count = await this.shopItemRepository.count();
    if (count === 0) {
      this.logger.log('Initializing default shop items...');
      for (const itemData of DEFAULT_SHOP_ITEMS) {
        const item = this.shopItemRepository.create(itemData as ShopItem);
        await this.shopItemRepository.save(item);
      }
      this.logger.log(`Created ${DEFAULT_SHOP_ITEMS.length} default shop items`);
    }
  }

  /**
   * Get all available shop items
   */
  async getShopItems(): Promise<ShopItem[]> {
    const now = new Date();

    const items = await this.shopItemRepository.find({
      where: { isAvailable: true },
      order: { category: 'ASC', price: 'ASC' },
    });

    // Filter by availability time
    return items.filter((item) => {
      if (item.availableFrom && now < item.availableFrom) {
        return false;
      }
      if (item.availableUntil && now > item.availableUntil) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get shop item by ID
   */
  async getShopItemById(id: string): Promise<ShopItem> {
    const item = await this.shopItemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Shop item not found');
    }
    return item;
  }

  /**
   * Get user's purchase count for a specific item today
   */
  private async getTodayPurchaseCount(
    userId: string,
    shopItemId: string,
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.purchaseRecordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .andWhere('record.shopItemId = :shopItemId', { shopItemId })
      .andWhere('record.purchasedAt >= :today', { today })
      .getCount();

    return count;
  }

  /**
   * Check if user can purchase the item (availability, limits, etc.)
   */
  async canPurchase(
    userId: string,
    shopItemId: string,
    quantity: number = 1,
  ): Promise<{ canPurchase: boolean; reason?: string }> {
    const item = await this.getShopItemById(shopItemId);

    // Check availability
    if (!item.isAvailable) {
      return { canPurchase: false, reason: 'Item is not available' };
    }

    const now = new Date();
    if (item.availableFrom && now < item.availableFrom) {
      return { canPurchase: false, reason: 'Item is not yet available' };
    }
    if (item.availableUntil && now > item.availableUntil) {
      return { canPurchase: false, reason: 'Item is no longer available' };
    }

    // Check purchase limit
    if (item.purchaseLimit > 0) {
      const purchasedCount = await this.getTodayPurchaseCount(userId, shopItemId);
      if (purchasedCount + quantity > item.purchaseLimit) {
        return {
          canPurchase: false,
          reason: `Daily purchase limit (${item.purchaseLimit}) exceeded`,
        };
      }
    }

    // Check coins
    const totalCost = item.price * quantity;
    const hasEnoughCoins = await this.coinService.hasEnoughCoins(userId, totalCost);
    if (!hasEnoughCoins) {
      return {
        canPurchase: false,
        reason: `Insufficient coins. Need ${totalCost}, have ${await this.coinService.getBalance(userId)}`,
      };
    }

    return { canPurchase: true };
  }

  /**
   * Purchase an item from the shop
   */
  async purchaseItem(
    userId: string,
    dto: PurchaseDto,
  ): Promise<{
    success: boolean;
    purchaseRecord: PurchaseRecord;
    rewards: ShopItemRewards;
    newBalance: number;
  }> {
    const { shopItemId, quantity = 1 } = dto;

    // Validate purchase
    const { canPurchase, reason } = await this.canPurchase(
      userId,
      shopItemId,
      quantity,
    );
    if (!canPurchase) {
      throw new BadRequestException(reason);
    }

    const item = await this.getShopItemById(shopItemId);
    const totalCost = item.price * quantity;

    // Deduct coins first (CoinService handles its own transaction)
    let newBalance: number;
    try {
      const result = await this.coinService.deductCoins(
        userId,
        totalCost,
        CoinTransactionSource.SHOP_PURCHASE,
        `Purchased ${quantity}x ${item.name}`,
        item.id,
      );
      newBalance = result.newBalance;
    } catch (error) {
      this.logger.error(`Failed to deduct coins for purchase: ${error.message}`);
      throw error;
    }

    // Calculate rewards
    const rewards = this.calculateRewards(item, quantity);

    // Grant rewards and create purchase record
    try {
      // Grant rewards
      await this.grantRewards(userId, rewards);

      // Create purchase record
      const purchaseRecord = this.purchaseRecordRepository.create({
        userId,
        shopItemId: item.id,
        quantity,
        totalCost,
        rewardsReceived: rewards,
      });
      await this.purchaseRecordRepository.save(purchaseRecord);

      this.logger.log(
        `User ${userId} purchased ${quantity}x ${item.name} for ${totalCost} coins`,
      );

      return {
        success: true,
        purchaseRecord,
        rewards,
        newBalance,
      };
    } catch (error) {
      // Refund coins if reward granting or record creation fails
      this.logger.error(
        `Failed to complete purchase, refunding coins: ${error.message}`,
      );
      await this.coinService.addCoins(
        userId,
        totalCost,
        CoinTransactionSource.ADMIN,
        `Refund for failed purchase of ${item.name}`,
      );
      throw error;
    }
  }

  /**
   * Calculate rewards based on item and quantity
   */
  private calculateRewards(item: ShopItem, quantity: number): ShopItemRewards {
    const baseRewards = item.rewards || {};
    const rewards: ShopItemRewards = {};

    // Multiply coin rewards by quantity
    if (baseRewards.coins) {
      rewards.coins = baseRewards.coins * quantity;
    }

    // Multiply item rewards by quantity
    if (baseRewards.itemId && baseRewards.itemQuantity) {
      rewards.itemId = baseRewards.itemId;
      rewards.itemQuantity = baseRewards.itemQuantity * quantity;
    }

    // Experience is multiplied
    if (baseRewards.experience) {
      rewards.experience = baseRewards.experience * quantity;
    }

    // Chest type doesn't multiply, but we return it
    if (baseRewards.chestType) {
      rewards.chestType = baseRewards.chestType;
      // For chests, quantity affects the number of items inside
      if (item.metadata?.maxItems) {
        rewards.chestQuantity = quantity;
      }
    }

    return rewards;
  }

  /**
   * Grant rewards to user
   */
  private async grantRewards(
    userId: string,
    rewards: ShopItemRewards,
  ): Promise<void> {
    // Grant coins
    if (rewards.coins && rewards.coins > 0) {
      await this.coinService.addCoins(
        userId,
        rewards.coins,
        CoinTransactionSource.SHOP_PURCHASE,
        'Shop reward',
      );
    }

    // Grant experience
    if (rewards.experience && rewards.experience > 0) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.experience = (user.experience || 0) + rewards.experience;
        // Level up check (every 100 XP = 1 level)
        const newLevel = Math.floor(user.experience / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        await this.userRepository.save(user);
      }
    }

    // Grant items
    if (rewards.itemId && rewards.itemQuantity) {
      try {
        const item = await this.itemService.findById(rewards.itemId);
        for (let i = 0; i < rewards.itemQuantity; i++) {
          await this.inventoryService.addItemToInventory(
            userId,
            item,
            0,
            0,
            'Shop Purchase',
          );
        }
      } catch (error) {
        this.logger.warn(
          `Failed to grant item ${rewards.itemId}: ${error.message}`,
        );
      }
    }

    // Chest handling - in a full implementation, this would create a UserChest entity
    // For now, we'll simulate chest rewards by granting random items
    if (rewards.chestType) {
      await this.handleChestReward(userId, rewards);
    }
  }

  /**
   * Handle chest rewards
   */
  private async handleChestReward(
    userId: string,
    rewards: ShopItemRewards,
  ): Promise<void> {
    const chestType = rewards.chestType;
    const quantity = rewards.chestQuantity || 1;

    this.logger.log(
      `User ${userId} opened ${quantity}x ${chestType} chest(s)`,
    );

    // In a full implementation, we would:
    // 1. Get chest definition from database
    // 2. Roll for random items based on drop pool
    // 3. Add items to user inventory

    // For now, grant some placeholder rewards based on chest type
    let coinReward = 0;
    let experienceReward = 0;

    switch (chestType) {
      case 'wooden':
        coinReward = 10 * quantity;
        experienceReward = 5 * quantity;
        break;
      case 'iron':
        coinReward = 50 * quantity;
        experienceReward = 25 * quantity;
        break;
      case 'golden':
        coinReward = 200 * quantity;
        experienceReward = 100 * quantity;
        break;
      case 'legendary':
        coinReward = 500 * quantity;
        experienceReward = 250 * quantity;
        break;
    }

    if (coinReward > 0) {
      await this.coinService.addCoins(
        userId,
        coinReward,
        CoinTransactionSource.CHEST_OPEN,
        `Chest reward (${chestType})`,
      );
    }

    if (experienceReward > 0) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.experience = (user.experience || 0) + experienceReward;
        const newLevel = Math.floor(user.experience / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        await this.userRepository.save(user);
      }
    }
  }

  /**
   * Get user's purchase history
   */
  async getPurchaseHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ records: PurchaseRecord[]; total: number }> {
    const queryBuilder = this.purchaseRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.shopItem', 'shopItem')
      .where('record.userId = :userId', { userId })
      .orderBy('record.purchasedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [records, total] = await queryBuilder.getManyAndCount();

    return { records, total };
  }
}