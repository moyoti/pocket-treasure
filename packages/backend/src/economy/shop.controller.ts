import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShopService } from './services/shop.service';
import { PurchaseDto } from './dto/purchase.dto';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /**
   * GET /api/shop/items
   * Get all available shop items
   */
  @Get('items')
  async getShopItems() {
    const items = await this.shopService.getShopItems();
    return { items };
  }

  /**
   * GET /api/shop/items/:id
   * Get a specific shop item by ID
   */
  @Get('items/:id')
  async getShopItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopService.getShopItemById(id);
  }

  /**
   * POST /api/shop/purchase
   * Purchase an item from the shop
   */
  @Post('purchase')
  async purchaseItem(@Request() req: any, @Body() dto: PurchaseDto) {
    return this.shopService.purchaseItem(req.user.id, dto);
  }

  /**
   * GET /api/shop/can-purchase/:id
   * Check if user can purchase a specific item
   */
  @Get('can-purchase/:id')
  async canPurchase(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('quantity') quantity?: string,
  ) {
    const qty = quantity ? parseInt(quantity, 10) : 1;
    return this.shopService.canPurchase(req.user.id, id, qty);
  }

  /**
   * GET /api/shop/history
   * Get user's purchase history
   */
  @Get('history')
  async getPurchaseHistory(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.shopService.getPurchaseHistory(
      req.user.id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}