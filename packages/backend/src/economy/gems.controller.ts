import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GemService } from './services/gem.service';

@Controller('gems')
@UseGuards(JwtAuthGuard)
export class GemsController {
  constructor(private readonly gemService: GemService) {}

  @Get('balance')
  async getBalance(@Request() req: any) {
    return this.gemService.getGemStats(req.user.id);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gemService.getTransactionHistory(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}