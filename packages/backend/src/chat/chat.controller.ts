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
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('conversations/:userId')
  async getMessages(
    @Request() req: any,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    return this.chatService.getMessages(req.user.id, userId, pageNum, limitNum);
  }

  @Post('send')
  async sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Post('read/:conversationId')
  async markAsRead(
    @Request() req: any,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    await this.chatService.markAsRead(req.user.id, conversationId);
    return { message: 'Messages marked as read' };
  }

  @Get('unread')
  async getUnreadCount(@Request() req: any) {
    return this.chatService.getUnreadCount(req.user.id);
  }
}