import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChestDefinition } from './entities/chest-definition.entity';
import { UserChest } from './entities/user-chest.entity';
import { GachaPool } from './entities/gacha-pool.entity';
import { GachaRecord } from './entities/gacha-record.entity';
import { MarketListing } from './entities/market-listing.entity';
import { ShopItem } from './entities/shop-item.entity';
import { PurchaseRecord } from './entities/purchase-record.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { Item } from '../item/entities/item.entity';
import { User } from '../user/entities/user.entity';
import { CoinService } from './services/coin.service';
import { ChestService } from './services/chest.service';
import { GachaService } from './services/gacha.service';
import { MarketService } from './services/market.service';
import { ShopService } from './services/shop.service';
import { ChestController } from './chest.controller';
import { GachaController } from './gacha.controller';
import { MarketController } from './market.controller';
import { ShopController } from './shop.controller';
import { EconomyController } from './economy.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [
    TypeOrmModule,
    TypeOrmModule.forFeature([
      ChestDefinition,
      UserChest,
      GachaPool,
      GachaRecord,
      MarketListing,
      ShopItem,
      PurchaseRecord,
      CoinTransaction,
      InventoryItem,
      Item,
      User,
    ]),
    InventoryModule,
    ItemModule,
  ],
  controllers: [ChestController, GachaController, MarketController, ShopController, EconomyController],
  providers: [CoinService, ChestService, GachaService, MarketService, ShopService],
  exports: [CoinService, ChestService, GachaService, MarketService, ShopService],
})
export class EconomyModule {}