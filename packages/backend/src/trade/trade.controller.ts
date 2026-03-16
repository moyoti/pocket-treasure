import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TradeService } from './trade.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTradeDto, TradeQueryDto } from './dto/create-trade.dto';

@Controller('trades')
@UseGuards(JwtAuthGuard)
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post()
  async createTrade(@Request() req: any, @Body() dto: CreateTradeDto) {
    return this.tradeService.createTrade(req.user.id, dto);
  }

  @Get()
  async getTrades(@Request() req: any, @Query() query: TradeQueryDto) {
    return this.tradeService.getTrades(req.user.id, query);
  }

  @Get('history')
  async getTradeHistory(@Request() req: any) {
    return this.tradeService.getTradeHistory(req.user.id);
  }

  @Get(':id')
  async getTradeById(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tradeService.getTradeById(id, req.user.id);
  }

  @Post(':id/accept')
  async acceptTrade(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tradeService.acceptTrade(id, req.user.id);
  }

  @Post(':id/reject')
  async rejectTrade(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tradeService.rejectTrade(id, req.user.id);
  }

  @Post(':id/cancel')
  async cancelTrade(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tradeService.cancelTrade(id, req.user.id);
  }
}