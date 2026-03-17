import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Trade, TradeStatus } from './entities/trade.entity';
import { TradeItem, TradeItemOwner } from './entities/trade-item.entity';
import { CreateTradeDto, TradeQueryDto, TradeItemDto } from './dto/create-trade.dto';
import { Friendship, FriendshipStatus } from '../friend/entities/friendship.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

@Injectable()
export class TradeService {
  private readonly logger = new Logger(TradeService.name);
  private readonly DEFAULT_EXPIRATION_HOURS = 24;

  constructor(
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(TradeItem)
    private tradeItemRepository: Repository<TradeItem>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  async createTrade(initiatorId: string, dto: CreateTradeDto): Promise<Trade> {
    const { receiverId, initiatorItems, receiverItems, message, expiresInHours } = dto;

    // Cannot trade with self
    if (initiatorId === receiverId) {
      throw new BadRequestException('Cannot create a trade with yourself');
    }

    // Verify friendship
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId: initiatorId, addresseeId: receiverId, status: FriendshipStatus.ACCEPTED },
        { requesterId: receiverId, addresseeId: initiatorId, status: FriendshipStatus.ACCEPTED },
      ],
    });

    if (!friendship) {
      throw new BadRequestException('You can only trade with friends');
    }

    // Check for existing pending trade between these users
    const existingTrade = await this.tradeRepository.findOne({
      where: [
        { initiatorId, receiverId, status: TradeStatus.PENDING },
        { initiatorId: receiverId, receiverId: initiatorId, status: TradeStatus.PENDING },
      ],
    });

    if (existingTrade) {
      throw new ConflictException('A pending trade already exists between you and this user');
    }

    // Verify initiator owns the items they're offering
    await this.verifyItemOwnership(initiatorId, initiatorItems, 'initiator');

    // Verify receiver owns the items being requested
    await this.verifyItemOwnership(receiverId, receiverItems, 'receiver');

    // Create trade with items in a transaction
    const savedTradeId = await this.tradeRepository.manager.transaction(async (manager) => {
      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + (expiresInHours || this.DEFAULT_EXPIRATION_HOURS),
      );

      const trade = manager.create(Trade, {
        initiatorId,
        receiverId,
        status: TradeStatus.PENDING,
        message,
        expiresAt,
      });

      const savedTrade = await manager.save(trade);

      // Create trade items
      const tradeItems: TradeItem[] = [];

      for (const item of initiatorItems) {
        const tradeItem = manager.create(TradeItem, {
          tradeId: savedTrade.id,
          inventoryItemId: item.inventoryItemId,
          itemId: item.itemId,
          itemName: item.itemName,
          owner: TradeItemOwner.INITIATOR,
          quantity: item.quantity,
        });
        tradeItems.push(tradeItem);
      }

      for (const item of receiverItems) {
        const tradeItem = manager.create(TradeItem, {
          tradeId: savedTrade.id,
          inventoryItemId: item.inventoryItemId,
          itemId: item.itemId,
          itemName: item.itemName,
          owner: TradeItemOwner.RECEIVER,
          quantity: item.quantity,
        });
        tradeItems.push(tradeItem);
      }

      await manager.save(TradeItem, tradeItems);

      this.logger.log(`Trade ${savedTrade.id} created by user ${initiatorId}`);

      return savedTrade.id;
    });

    // Return trade with items
    return this.getTradeById(savedTradeId, initiatorId);
  }

  private async verifyItemOwnership(
    userId: string,
    items: TradeItemDto[],
    role: string,
  ): Promise<void> {
    for (const item of items) {
      const inventoryItem = await this.inventoryRepository.findOne({
        where: { id: item.inventoryItemId, userId },
      });

      if (!inventoryItem) {
        throw new BadRequestException(
          `Item ${item.itemName} not found in ${role}'s inventory`,
        );
      }

      if (inventoryItem.itemId !== item.itemId) {
        throw new BadRequestException(
          `Inventory item ${item.inventoryItemId} does not match item ${item.itemId}`,
        );
      }

      if (inventoryItem.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient quantity of ${item.itemName}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`,
        );
      }
    }
  }

  async getTrades(userId: string, query: TradeQueryDto): Promise<Trade[]> {
    const { status, type = 'all' } = query;

    const queryBuilder = this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.items', 'items')
      .where('(trade.initiatorId = :userId OR trade.receiverId = :userId)', { userId });

    if (status) {
      queryBuilder.andWhere('trade.status = :status', { status });
    }

    if (type === 'sent') {
      queryBuilder.andWhere('trade.initiatorId = :userId', { userId });
    } else if (type === 'received') {
      queryBuilder.andWhere('trade.receiverId = :userId', { userId });
    }

    queryBuilder.orderBy('trade.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async getTradeById(tradeId: string, userId: string): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['items'],
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Verify user is part of the trade
    if (trade.initiatorId !== userId && trade.receiverId !== userId) {
      throw new NotFoundException('Trade not found');
    }

    return trade;
  }

  async acceptTrade(tradeId: string, userId: string): Promise<Trade> {
    const trade = await this.getTradeById(tradeId, userId);

    // Only receiver can accept
    if (trade.receiverId !== userId) {
      throw new BadRequestException('Only the receiver can accept the trade');
    }

    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException(`Cannot accept a trade with status: ${trade.status}`);
    }

    // Check if trade has expired
    if (new Date() > trade.expiresAt) {
      trade.status = TradeStatus.EXPIRED;
      await this.tradeRepository.save(trade);
      throw new BadRequestException('Trade has expired');
    }

    // Execute trade with transaction
    await this.tradeRepository.manager.transaction(async (manager) => {
      // Get all trade items
      const tradeItems = trade.items;

      // Separate items by owner
      const initiatorItems = tradeItems.filter(
        (item) => item.owner === TradeItemOwner.INITIATOR,
      );
      const receiverItems = tradeItems.filter(
        (item) => item.owner === TradeItemOwner.RECEIVER,
      );

      // Transfer items from initiator to receiver
      await this.transferItems(
        trade.initiatorId,
        trade.receiverId,
        initiatorItems,
        manager,
      );

      // Transfer items from receiver to initiator
      await this.transferItems(
        trade.receiverId,
        trade.initiatorId,
        receiverItems,
        manager,
      );

      // Update trade status
      trade.status = TradeStatus.ACCEPTED;
      trade.completedAt = new Date();
      await manager.save(trade);

      this.logger.log(`Trade ${tradeId} accepted by user ${userId}`);
    });

    return this.getTradeById(tradeId, userId);
  }

  private async transferItems(
    fromUserId: string,
    toUserId: string,
    items: TradeItem[],
    manager: any,
  ): Promise<void> {
    for (const tradeItem of items) {
      // Get the inventory item from sender
      const fromInventoryItem = await manager.findOne(InventoryItem, {
        where: { id: tradeItem.inventoryItemId, userId: fromUserId },
      });

      if (!fromInventoryItem) {
        throw new BadRequestException(
          `Item ${tradeItem.itemName} no longer available in sender's inventory`,
        );
      }

      if (fromInventoryItem.quantity < tradeItem.quantity) {
        throw new BadRequestException(
          `Insufficient quantity of ${tradeItem.itemName}. Available: ${fromInventoryItem.quantity}, Required: ${tradeItem.quantity}`,
        );
      }

      // Remove or reduce quantity from sender
      if (fromInventoryItem.quantity === tradeItem.quantity) {
        await manager.remove(fromInventoryItem);
      } else {
        fromInventoryItem.quantity -= tradeItem.quantity;
        await manager.save(fromInventoryItem);
      }

      // Add to receiver's inventory
      let toInventoryItem = await manager.findOne(InventoryItem, {
        where: { userId: toUserId, itemId: tradeItem.itemId },
      });

      if (toInventoryItem) {
        // Increment quantity if item exists
        toInventoryItem.quantity += tradeItem.quantity;
        await manager.save(toInventoryItem);
      } else {
        // Create new inventory item for receiver
        toInventoryItem = manager.create(InventoryItem, {
          userId: toUserId,
          itemId: tradeItem.itemId,
          quantity: tradeItem.quantity,
          collectedLatitude: fromInventoryItem.collectedLatitude,
          collectedLongitude: fromInventoryItem.collectedLongitude,
          poiName: fromInventoryItem.poiName,
        });
        await manager.save(toInventoryItem);
      }
    }
  }

  async rejectTrade(tradeId: string, userId: string): Promise<Trade> {
    const trade = await this.getTradeById(tradeId, userId);

    // Only receiver can reject
    if (trade.receiverId !== userId) {
      throw new BadRequestException('Only the receiver can reject the trade');
    }

    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException(`Cannot reject a trade with status: ${trade.status}`);
    }

    trade.status = TradeStatus.REJECTED;
    await this.tradeRepository.save(trade);

    this.logger.log(`Trade ${tradeId} rejected by user ${userId}`);

    return this.getTradeById(tradeId, userId);
  }

  async cancelTrade(tradeId: string, userId: string): Promise<Trade> {
    const trade = await this.getTradeById(tradeId, userId);

    // Only initiator can cancel
    if (trade.initiatorId !== userId) {
      throw new BadRequestException('Only the initiator can cancel the trade');
    }

    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel a trade with status: ${trade.status}`);
    }

    trade.status = TradeStatus.CANCELLED;
    await this.tradeRepository.save(trade);

    this.logger.log(`Trade ${tradeId} cancelled by user ${userId}`);

    return this.getTradeById(tradeId, userId);
  }

  async getTradeHistory(userId: string): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: [
        { initiatorId: userId, status: In([TradeStatus.ACCEPTED, TradeStatus.REJECTED, TradeStatus.EXPIRED]) },
        { receiverId: userId, status: In([TradeStatus.ACCEPTED, TradeStatus.REJECTED, TradeStatus.EXPIRED]) },
      ],
      relations: ['items'],
      order: { completedAt: 'DESC' },
    });
  }

  // Method to check and expire trades (can be called by a cron job)
  async expireTrades(): Promise<number> {
    const result = await this.tradeRepository
      .createQueryBuilder()
      .update(Trade)
      .set({ status: TradeStatus.EXPIRED })
      .where('status = :status', { status: TradeStatus.PENDING })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();

    const affected = result.affected ?? 0;
    if (affected > 0) {
      this.logger.log(`Expired ${affected} trades`);
    }

    return affected;
  }
}