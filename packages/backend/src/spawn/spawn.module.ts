import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpawnController } from './spawn.controller';
import { SpawnService } from './spawn.service';
import { SpawnedItem } from './entities/spawned-item.entity';
import { ItemModule } from '../item/item.module';
import { PoiModule } from '../poi/poi.module';
import { InventoryModule } from '../inventory/inventory.module';
import { EventModule } from '../event/event.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpawnedItem]),
    ItemModule,
    PoiModule,
    InventoryModule,
    EventModule,
    UserModule,
  ],
  controllers: [SpawnController],
  providers: [SpawnService],
  exports: [SpawnService],
})
export class SpawnModule {}