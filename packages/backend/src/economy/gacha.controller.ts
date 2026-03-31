import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GachaService, GachaPullResult } from './services/gacha.service';
import { PullGachaDto } from './dto/pull-gacha.dto';

@Controller('gacha')
@UseGuards(JwtAuthGuard)
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Get('pools')
  async getPools() {
    return this.gachaService.getPools();
  }

  @Get('pity')
  async getPityCount(@Request() req: any, @Query('poolId') poolId: string) {
    if (!poolId) {
      return { error: 'poolId is required' };
    }
    const pityCount = await this.gachaService.getPityCount(req.user.id, poolId);
    return { poolId, pityCount };
  }

  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('poolId') poolId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gachaService.getHistory(
      req.user.id,
      poolId,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('pull')
  async pull(@Request() req: any, @Body() dto: PullGachaDto): Promise<GachaPullResult> {
    return this.gachaService.pull(req.user.id, dto, dto.currency || 'coins');
  }
}