import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendFriendRequestDto, SearchUserDto } from './dto/send-friend-request.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request')
  async sendFriendRequest(
    @Request() req: any,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendService.sendFriendRequest(req.user.id, dto);
  }

  @Post('accept/:id')
  async acceptFriendRequest(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.friendService.acceptFriendRequest(req.user.id, id);
  }

  @Post('reject/:id')
  async rejectFriendRequest(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.friendService.rejectFriendRequest(req.user.id, id);
    return { message: 'Friend request rejected' };
  }

  @Delete(':id')
  async removeFriend(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.friendService.removeFriend(req.user.id, id);
    return { message: 'Friend removed' };
  }

  @Get()
  async getFriends(@Request() req: any) {
    return this.friendService.getFriends(req.user.id);
  }

  @Get('requests')
  async getPendingRequests(@Request() req: any) {
    const received = await this.friendService.getPendingRequests(req.user.id);
    const sent = await this.friendService.getSentRequests(req.user.id);
    return { received, sent };
  }

  @Get('online')
  async getOnlineFriends(@Request() req: any) {
    return this.friendService.getOnlineFriends(req.user.id);
  }

  @Get('search')
  async searchUsers(
    @Request() req: any,
    @Query('query') query: string,
  ) {
    const dto: SearchUserDto = { query };
    return this.friendService.searchUsers(req.user.id, dto);
  }

  @Get('status/:userId')
  async getFriendshipStatus(
    @Request() req: any,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const friendship = await this.friendService.getFriendshipStatus(
      req.user.id,
      userId,
    );
    return { friendship };
  }
}