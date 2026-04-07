import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketService } from './services/market.service';
import { MarketTransactionService } from './services/market-transaction.service';
import { CreateListingDto, MarketQueryDto, BuyListingDto } from './dto/market-list.dto';
import { PriceHistoryQueryDto, RecentSalesQueryDto, MarketStatsQueryDto } from './dto/market-transaction.dto';
import { ItemRarity } from '../item/entities/item.entity';

@Controller('market')
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly marketTransactionService: MarketTransactionService,
  ) {}

  /**
   * GET /api/market/listings
   * Get all active market listings with filters
   */
  @Get('listings')
  async getListings(@Query() query: MarketQueryDto) {
    const result = await this.marketService.getListings(query);
    return {
      listings: result.listings,
      total: result.total,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  /**
   * GET /api/market/my/listings
   * Get current user's listings
   */
  @Get('my/listings')
  async getMyListings(@Request() req: any) {
    return this.marketService.getMyListings(req.user.id);
  }

  /**
   * GET /api/market/stats
   * Get market statistics
   */
  @Get('stats')
  async getMarketStats() {
    return this.marketService.getMarketStats();
  }

  /**
   * GET /api/market/price-range/:rarity
   * Get price range for a specific rarity
   */
  @Get('price-range/:rarity')
  async getPriceRange(@Param('rarity') rarity: string) {
    if (!Object.values(ItemRarity).includes(rarity as ItemRarity)) {
      throw new BadRequestException('Invalid rarity. Valid values: common, rare, epic, legendary');
    }
    return this.marketService.getPriceRange(rarity as ItemRarity);
  }

  /**
   * GET /api/market/history/price/:itemId
   * Get price history for an item
   */
  @Get('history/price/:itemId')
  async getPriceHistory(@Param('itemId') itemId: string, @Query() query: PriceHistoryQueryDto) {
    return this.marketTransactionService.getPriceHistory(itemId, query.days);
  }

  /**
   * GET /api/market/history/recent
   * Get recent market transactions
   */
  @Get('history/recent')
  async getRecentSales(@Query() query: RecentSalesQueryDto) {
    return this.marketTransactionService.getRecentSales(query.limit, query.itemId);
  }

  /**
   * GET /api/market/history/:itemId/stats
   * Get market statistics for a specific item
   */
  @Get('history/:itemId/stats')
  async getItemMarketStats(@Param('itemId') itemId: string) {
    return this.marketTransactionService.getItemStats(itemId);
  }

  /**
   * POST /api/market/list
   * Create a new market listing
   */
  @Post('list')
  async createListing(@Request() req: any, @Body() dto: CreateListingDto) {
    return this.marketService.createListing(req.user.id, dto);
  }

  /**
   * POST /api/market/buy/:id
   * Buy a market listing
   */
  @Post('buy/:id')
  async buyListing(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BuyListingDto,
  ) {
    return this.marketService.buyListing(req.user.id, id, dto);
  }

  /**
   * POST /api/market/cancel/:id
   * Cancel a market listing
   */
  @Post('cancel/:id')
  async cancelListing(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.marketService.cancelListing(req.user.id, id);
  }
}