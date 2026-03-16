import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { Trade } from './entities/trade.entity';
import { TradeItem } from './entities/trade-item.entity';
import { Friendship } from '../friend/entities/friendship.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, TradeItem, Friendship, InventoryItem]),
  ],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}