import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RechargeService } from './services/recharge.service';

@Controller('recharge')
@UseGuards(JwtAuthGuard)
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Get('packages')
  async getPackages() {
    return this.rechargeService.getPackages();
  }

  @Get('packages/:id')
  async getPackage(@Param('id') id: string) {
    return this.rechargeService.getPackage(id);
  }

  @Post('orders')
  async createOrder(@Request() req: any, @Body() body: { packageId: string }) {
    return this.rechargeService.createOrder(req.user.id, body.packageId);
  }

  @Post('callback')
  async paymentCallback(@Body() body: { orderId: string; transactionId?: string; status: string }) {
    if (body.status === 'completed') {
      await this.rechargeService.completeOrder(body.orderId, body.transactionId || 'mock');
    } else {
      await this.rechargeService.failOrder(body.orderId);
    }
    return { success: true };
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.rechargeService.getUserRechargeHistory(req.user.id);
  }
}
