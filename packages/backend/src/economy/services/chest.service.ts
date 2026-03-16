import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChestDefinition, ChestType, ChestDrop } from '../entities/chest-definition.entity';
import { UserChest } from '../entities/user-chest.entity';
import { User } from '../../user/entities/user.entity';
import { Item, ItemRarity } from '../../item/entities/item.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { CoinService } from './coin.service';
import { CoinTransactionSource } from '../entities/coin-transaction.entity';
import { OpenChestDto } from '../dto/open-chest.dto';

// Default chest definitions
const DEFAULT_CHESTS: Partial<ChestDefinition>[] = [
  {
    name: '木箱',
    description: '普通的木箱，可能包含常见物品',
    type: ChestType.WOODEN,
    price: 0,
    iconUrl: '/icons/chest-wooden.png',
    drops: [
      { rarity: 'common', weight: 80, minQuantity: 1, maxQuantity: 2 },
      { rarity: 'rare', weight: 20, minQuantity: 1, maxQuantity: 1 },
    ],
  },
  {
    name: '铁箱',
    description: '坚固的铁箱，可能包含稀有物品',
    type: ChestType.IRON,
    price: 100,
    iconUrl: '/icons/chest-iron.png',
    drops: [
      { rarity: 'common', weight: 50, minQuantity: 1, maxQuantity: 2 },
      { rarity: 'rare', weight: 40, minQuantity: 1, maxQuantity: 2 },
      { rarity: 'epic', weight: 10, minQuantity: 1, maxQuantity: 1 },
    ],
  },
  {
    name: '金箱',
    description: '华丽的金箱，可能包含史诗物品',
    type: ChestType.GOLDEN,
    price: 500,
    iconUrl: '/icons/chest-golden.png',
    drops: [
      { rarity: 'rare', weight: 50, minQuantity: 1, maxQuantity: 2 },
      { rarity: 'epic', weight: 35, minQuantity: 1, maxQuantity: 2 },
      { rarity: 'legendary', weight: 15, minQuantity: 1, maxQuantity: 1 },
    ],
  },
  {
    name: '传说箱',
    description: '神秘的传说箱，必定包含传说物品',
    type: ChestType.LEGENDARY,
    price: 2000,
    iconUrl: '/icons/chest-legendary.png',
    drops: [
      { rarity: 'epic', weight: 40, minQuantity: 1, maxQuantity: 2 },
      { rarity: 'legendary', weight: 60, minQuantity: 1, maxQuantity: 2 },
    ],
  },
];

export interface OpenChestResult {
  success: boolean;
  chest: ChestDefinition;
  rewards: {
    item: Item;
    quantity: number;
  }[];
  coinsSpent: number;
  newCoinBalance: number;
}

@Injectable()
export class ChestService {
  private readonly logger = new Logger(ChestService.name);

  constructor(
    @InjectRepository(ChestDefinition)
    private chestDefinitionRepository: Repository<ChestDefinition>,
    @InjectRepository(UserChest)
    private userChestRepository: Repository<UserChest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    private coinService: CoinService,
    private dataSource: DataSource,
  ) {}

  /**
   * Initialize default chests
   */
  async initializeChests(): Promise<void> {
    const count = await this.chestDefinitionRepository.count();
    if (count === 0) {
      this.logger.log('Initializing default chests...');
      for (const chestData of DEFAULT_CHESTS) {
        const chest = this.chestDefinitionRepository.create(chestData);
        await this.chestDefinitionRepository.save(chest);
      }
      this.logger.log('Default chests initialized');
    }
  }

  /**
   * Get all available chests
   */
  async getChests(): Promise<ChestDefinition[]> {
    await this.initializeChests();
    return this.chestDefinitionRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  /**
   * Get user's owned chests
   */
  async getUserChests(userId: string): Promise<UserChest[]> {
    return this.userChestRepository.find({
      where: { userId },
      relations: ['chest'],
    });
  }

  /**
   * Open a chest
   */
  async openChest(userId: string, dto: OpenChestDto): Promise<OpenChestResult> {
    await this.initializeChests();

    const { chestId, quantity = 1 } = dto;

    // Get chest definition
    const chest = await this.chestDefinitionRepository.findOne({
      where: { id: chestId, isActive: true },
    });

    if (!chest) {
      throw new NotFoundException('Chest not found');
    }

    // Check if user has the chest or needs to buy it
    const userChest = await this.userChestRepository.findOne({
      where: { userId, chestId },
    });

    const hasOwnedChest = userChest && userChest.quantity >= quantity;
    const coinsNeeded = hasOwnedChest ? 0 : chest.price * quantity;

    // Check if user has enough coins
    if (!hasOwnedChest && coinsNeeded > 0) {
      const hasEnoughCoins = await this.coinService.hasEnoughCoins(userId, coinsNeeded);
      if (!hasEnoughCoins) {
        throw new BadRequestException(`Insufficient coins. Required: ${coinsNeeded}`);
      }
    }

    // Use transaction to handle the whole operation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct coins or use owned chest
      let newCoinBalance = await this.coinService.getBalance(userId);

      if (hasOwnedChest) {
        // Use owned chest
        userChest.quantity -= quantity;
        if (userChest.quantity <= 0) {
          await queryRunner.manager.remove(userChest);
        } else {
          await queryRunner.manager.save(userChest);
        }
      } else if (coinsNeeded > 0) {
        // Spend coins
        const result = await this.coinService.spendCoins(
          userId,
          coinsNeeded,
          CoinTransactionSource.CHEST_OPEN,
          `Opened ${quantity} ${chest.name}`,
        );
        newCoinBalance = result.newBalance;
      }

      // Generate rewards
      const rewards: { item: Item; quantity: number }[] = [];

      for (let i = 0; i < quantity; i++) {
        const dropResult = this.selectDrop(chest.drops);
        const items = await this.getItemsByRarity(dropResult.rarity);

        if (items.length > 0) {
          // Randomly select an item from the rarity pool
          const randomItem = items[Math.floor(Math.random() * items.length)];
          const rewardQuantity = Math.floor(
            Math.random() * (dropResult.maxQuantity - dropResult.minQuantity + 1)
          ) + dropResult.minQuantity;

          // Check if already in rewards
          const existingReward = rewards.find(r => r.item.id === randomItem.id);
          if (existingReward) {
            existingReward.quantity += rewardQuantity;
          } else {
            rewards.push({ item: randomItem, quantity: rewardQuantity });
          }
        }
      }

      // Add items to inventory
      for (const reward of rewards) {
        await this.addItemToInventory(userId, reward.item, reward.quantity, queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`User ${userId} opened ${quantity} ${chest.name}(s). Rewards: ${rewards.map(r => `${r.item.name}x${r.quantity}`).join(', ')}`);

      return {
        success: true,
        chest,
        rewards,
        coinsSpent: coinsNeeded,
        newCoinBalance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Grant a chest to user
   */
  async grantChest(userId: string, chestType: ChestType, quantity: number = 1): Promise<UserChest> {
    const chest = await this.chestDefinitionRepository.findOne({
      where: { type: chestType },
    });

    if (!chest) {
      throw new NotFoundException('Chest type not found');
    }

    let userChest = await this.userChestRepository.findOne({
      where: { userId, chestId: chest.id },
    });

    if (userChest) {
      userChest.quantity += quantity;
    } else {
      userChest = this.userChestRepository.create({
        userId,
        chestId: chest.id,
        quantity,
      });
    }

    return this.userChestRepository.save(userChest);
  }

  /**
   * Select a drop based on weights
   */
  private selectDrop(drops: ChestDrop[]): ChestDrop {
    const totalWeight = drops.reduce((sum, drop) => sum + drop.weight, 0);
    let random = Math.random() * totalWeight;

    for (const drop of drops) {
      random -= drop.weight;
      if (random <= 0) {
        return drop;
      }
    }

    return drops[drops.length - 1];
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
        poiName: 'Chest Reward',
      });
      await manager.save(inventoryItem);
    }
  }
}