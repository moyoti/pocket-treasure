import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SpawnService } from './spawn.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CollectItemDto } from './dto/collect-item.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { SpawnNearbyDto } from './dto/spawn-nearby.dto';

@Controller('spawned-items')
@UseGuards(JwtAuthGuard)
export class SpawnController {
  private readonly logger = new Logger(SpawnController.name);

  constructor(private readonly spawnService: SpawnService) {}

  @Get('nearby')
  async getNearbyItems(@Request() req: any, @Query() query: NearbyQueryDto) {
    this.logger.debug(`Fetching nearby items at (${query.lat}, ${query.lng}) with radius ${query.radius || 5}km`);
    return this.spawnService.getNearbySpawnedItems(
      query.lat,
      query.lng,
      query.radius || 5,
      req.user?.id,  // Pass userId for user-triggered spawn
    );
  }

  @Get('bonuses')
  async getCurrentBonuses() {
    return this.spawnService.getCurrentBonuses();
  }

  @Post('collect')
  async collectItem(@Request() req: any, @Body() collectDto: CollectItemDto) {
    this.logger.debug(`User ${req.user.id} collecting item ${collectDto.spawnedItemId}`);
    return this.spawnService.collectItem(req.user.id, collectDto);
  }

  @Post('spawn')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async spawnItems(@Query('count') count?: string) {
    const spawnCount = count ? parseInt(count) : 50;
    this.logger.log(`Admin spawning ${spawnCount} items`);
    return this.spawnService.scheduledSpawn();
  }

  @Post('spawn-nearby')
  async spawnNearbyItems(@Body() body: SpawnNearbyDto) {
    this.logger.debug(`Spawning items near (${body.latitude}, ${body.longitude}), count: ${body.count || 10}`);
    return this.spawnService.spawnItemsNearLocation(
      body.latitude,
      body.longitude,
      body.count || 10,
    );
  }
}