import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { Item } from '../item/entities/item.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  async getUserInventory(userId: string): Promise<InventoryItem[]> {
    return this.inventoryRepository.find({
      where: { userId },
      relations: ['item'],
      order: { collectedAt: 'DESC' },
    });
  }

  async getUserInventoryStats(userId: string): Promise<{
    totalItems: number;
    uniqueItems: number;
    byRarity: Record<string, number>;
  }> {
    const items = await this.inventoryRepository
      .createQueryBuilder('ii')
      .leftJoinAndSelect('ii.item', 'item')
      .where('ii.userId = :userId', { userId })
      .getMany();

    const stats = {
      totalItems: items.reduce((sum, ii) => sum + ii.quantity, 0),
      uniqueItems: items.length,
      byRarity: {} as Record<string, number>,
    };

    // Count by rarity
    for (const ii of items) {
      const rarity = (ii.item as any).rarity;
      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + ii.quantity;
    }

    return stats;
  }

  async addItemToInventory(
    userId: string,
    item: Item,
    latitude: number,
    longitude: number,
    poiName?: string,
  ): Promise<InventoryItem> {
    this.logger.debug(`Adding item ${item.id} to inventory for user ${userId}`);

    // Check if user already has this item
    let inventoryItem = await this.inventoryRepository.findOne({
      where: { userId, itemId: item.id },
    });

    if (inventoryItem) {
      // Increment quantity if stackable
      if (inventoryItem.quantity < item.maxStack) {
        inventoryItem.quantity += 1;
        this.logger.debug(`Incremented quantity for item ${item.id} to ${inventoryItem.quantity}`);
        return this.inventoryRepository.save(inventoryItem);
      } else {
        this.logger.warn(`Item ${item.id} has reached max stack size ${item.maxStack}`);
      }
    }

    // Create new inventory item
    inventoryItem = this.inventoryRepository.create({
      userId,
      item,
      itemId: item.id,
      quantity: 1,
      collectedLatitude: latitude,
      collectedLongitude: longitude,
      poiName,
    });

    const savedItem = await this.inventoryRepository.save(inventoryItem);
    this.logger.log(`Added new item ${item.id} to inventory for user ${userId}`);
    return savedItem;
  }

  async removeItemFromInventory(
    userId: string,
    inventoryItemId: string,
    quantity: number = 1,
  ): Promise<void> {
    this.logger.debug(`Removing ${quantity} of item ${inventoryItemId} from user ${userId}'s inventory`);

    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id: inventoryItemId, userId },
    });

    if (!inventoryItem) {
      this.logger.warn(`Item ${inventoryItemId} not found in inventory for user ${userId}`);
      throw new NotFoundException('Item not found in inventory');
    }

    if (inventoryItem.quantity <= quantity) {
      await this.inventoryRepository.remove(inventoryItem);
      this.logger.log(`Removed item ${inventoryItemId} from user ${userId}'s inventory`);
    } else {
      inventoryItem.quantity -= quantity;
      await this.inventoryRepository.save(inventoryItem);
      this.logger.debug(`Reduced quantity of item ${inventoryItemId} to ${inventoryItem.quantity}`);
    }
  }

  async getInventoryItemById(
    userId: string,
    inventoryItemId: string,
  ): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id: inventoryItemId, userId },
      relations: ['item'],
    });

    if (!inventoryItem) {
      this.logger.warn(`Inventory item ${inventoryItemId} not found for user ${userId}`);
      throw new NotFoundException('Item not found in inventory');
    }

    return inventoryItem;
  }
}