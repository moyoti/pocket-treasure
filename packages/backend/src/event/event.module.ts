import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { GameEvent } from './entities/game-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameEvent])],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}