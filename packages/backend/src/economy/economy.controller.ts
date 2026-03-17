import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoinService, CoinTransactionSource, CoinTransactionType } from './services/coin.service';
import { SellItemDto } from './dto/sell-item.dto';
import { ItemRarity } from '../item/entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { User } from '../user/entities/user.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';

// NPC item prices by rarity
const NPC_PRICES: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 5,
  [ItemRarity.RARE]: 25,
  [ItemRarity.EPIC]: 100,
  [ItemRarity.LEGENDARY]: 500,
};

@Controller('economy')
@UseGuards(JwtAuthGuard)
export class EconomyController {
  constructor(
    private readonly coinService: CoinService,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  @Get('balance')
  async getBalance(@Request() req: any) {
    const balance = await this.coinService.getBalance(req.user.id);
    return { balance };
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const stats = await this.coinService.getCoinStats(req.user.id);
    return stats;
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: CoinTransactionType,
    @Query('source') source?: CoinTransactionSource,
  ) {
    const result = await this.coinService.getTransactions(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type,
      source,
    });
    return result;
  }

  @Post('sell')
  async sellItem(@Request() req: any, @Body() dto: SellItemDto) {
    const { inventoryItemId, quantity } = dto;

    // Get the inventory item with item details
    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id: inventoryItemId, userId: req.user.id },
      relations: ['item'],
    });

    if (!inventoryItem) {
      throw new NotFoundException('Item not found in your inventory');
    }

    // Check quantity
    if (inventoryItem.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient quantity. Available: ${inventoryItem.quantity}`,
      );
    }

    // Calculate price based on rarity
    const rarity = inventoryItem.item.rarity;
    const unitPrice = NPC_PRICES[rarity];
    const totalPrice = unitPrice * quantity;

    // Use transaction to ensure atomicity
    return await this.inventoryRepository.manager.transaction(async (manager) => {
      // Remove or reduce item from inventory
      if (inventoryItem.quantity === quantity) {
        await manager.remove(inventoryItem);
      } else {
        inventoryItem.quantity -= quantity;
        await manager.save(inventoryItem);
      }

      // Get user and update coins
      const user = await manager.findOne(User, { where: { id: req.user.id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const previousBalance = user.coins;
      user.coins += totalPrice;
      user.totalCoinsEarned = (user.totalCoinsEarned || 0) + totalPrice;

      // Create transaction record
      const transaction = manager.create(CoinTransaction, {
        userId: req.user.id,
        type: CoinTransactionType.EARN,
        source: CoinTransactionSource.ITEM_SALE,
        amount: totalPrice,
        description: `Sold ${quantity}x ${inventoryItem.item.name} to NPC`,
        referenceId: inventoryItemId,
        metadata: { itemRarity: rarity, unitPrice, quantity },
      });

      await manager.save(user);
      await manager.save(transaction);

      return {
        success: true,
        itemName: inventoryItem.item.name,
        quantity,
        unitPrice,
        totalPrice,
        previousBalance,
        newBalance: user.coins,
      };
    });
  }
}