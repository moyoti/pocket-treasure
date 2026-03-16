import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyTaskController } from './daily-task.controller';
import { DailyTaskService } from './daily-task.service';
import { DailyTask } from './entities/daily-task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { UserModule } from '../user/user.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyTask, TaskTemplate]),
    UserModule,
    InventoryModule,
    ItemModule,
  ],
  controllers: [DailyTaskController],
  providers: [DailyTaskService],
  exports: [DailyTaskService],
})
export class DailyTaskModule {}