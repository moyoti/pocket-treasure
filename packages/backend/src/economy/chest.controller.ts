import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChestService, OpenChestResult } from './services/chest.service';
import { OpenChestDto } from './dto/open-chest.dto';

@Controller('chests')
@UseGuards(JwtAuthGuard)
export class ChestController {
  constructor(private readonly chestService: ChestService) {}

  @Get()
  async getChests() {
    return this.chestService.getChests();
  }

  @Get('my')
  async getUserChests(@Request() req: any) {
    return this.chestService.getUserChests(req.user.id);
  }

  @Post('open')
  async openChest(@Request() req: any, @Body() dto: OpenChestDto): Promise<OpenChestResult> {
    return this.chestService.openChest(req.user.id, dto);
  }
}