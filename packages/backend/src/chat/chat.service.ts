import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { Friendship, FriendshipStatus } from '../friend/entities/friendship.entity';
import { SendMessageDto } from './dto/send-message.dto';

export interface ConversationWithDetails {
  conversation: Conversation;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface MessageWithSender {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    private dataSource: DataSource,
  ) {}

  private async getOrCreateConversation(
    user1Id: string,
    user2Id: string,
  ): Promise<Conversation> {
    // Ensure consistent ordering (smaller ID first)
    const [sortedUser1Id, sortedUser2Id] =
      user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    let conversation = await this.conversationRepository.findOne({
      where: { user1Id: sortedUser1Id, user2Id: sortedUser2Id },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        user1Id: sortedUser1Id,
        user2Id: sortedUser2Id,
      });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  private async checkFriendship(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId: userId, addresseeId: otherUserId, status: FriendshipStatus.ACCEPTED },
        { requesterId: otherUserId, addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });
    return !!friendship;
  }

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const { receiverId, content } = dto;

    // Cannot send message to self
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Check if receiver exists
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Check if users are friends
    const areFriends = await this.checkFriendship(senderId, receiverId);
    if (!areFriends) {
      throw new ForbiddenException('You can only send messages to friends');
    }

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(senderId, receiverId);

    // Create message
    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      isRead: false,
    });
    await this.messageRepository.save(message);

    // Update conversation with last message and increment unread count
    const isUser1 = conversation.user1Id === senderId;
    if (isUser1) {
      conversation.unreadCountUser2 += 1;
    } else {
      conversation.unreadCountUser1 += 1;
    }
    conversation.lastMessageId = message.id;
    await this.conversationRepository.save(conversation);

    return message;
  }

  async getConversations(userId: string): Promise<ConversationWithDetails[]> {
    // Find all conversations where user is participant
    const conversations = await this.conversationRepository.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
      order: { updatedAt: 'DESC' },
    });

    if (conversations.length === 0) {
      return [];
    }

    // Get all other user IDs
    const otherUserIds = conversations.map((c) =>
      c.user1Id === userId ? c.user2Id : c.user1Id,
    );

    // Fetch other users
    const users = await this.userRepository.find({
      where: { id: In(otherUserIds) },
    });

    // Get last message IDs
    const lastMessageIds = conversations
      .filter((c) => c.lastMessageId)
      .map((c) => c.lastMessageId);

    // Fetch last messages
    let lastMessages: Message[] = [];
    if (lastMessageIds.length > 0) {
      lastMessages = await this.messageRepository.find({
        where: { id: In(lastMessageIds) },
      });
    }

    // Map conversations with details
    return conversations.map((conversation) => {
      const otherUserId =
        conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
      const otherUser = users.find((u) => u.id === otherUserId);
      const lastMessage = lastMessages.find((m) => m.id === conversation.lastMessageId);
      const unreadCount =
        conversation.user1Id === userId
          ? conversation.unreadCountUser1
          : conversation.unreadCountUser2;

      return {
        conversation,
        otherUser: otherUser!,
        lastMessage,
        unreadCount,
      };
    });
  }

  async getMessages(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: MessageWithSender[]; total: number }> {
    // Check if users are friends
    const areFriends = await this.checkFriendship(userId, otherUserId);
    if (!areFriends) {
      throw new ForbiddenException('You can only view messages with friends');
    }

    // Get messages between users
    const [messages, total] = await this.messageRepository.findAndCount({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sender'],
    });

    // Format messages
    const formattedMessages: MessageWithSender[] = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        username: msg.sender.username,
        avatar: msg.sender.avatar,
      },
    }));

    return { messages: formattedMessages, total };
  }

  async markAsRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // Determine the other user in the conversation
    const otherUserId =
      conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    // Mark all unread messages from the other user as read
    await this.messageRepository.update(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    // Reset unread count for this user
    if (conversation.user1Id === userId) {
      conversation.unreadCountUser1 = 0;
    } else {
      conversation.unreadCountUser2 = 0;
    }
    await this.conversationRepository.save(conversation);
  }

  async getUnreadCount(userId: string): Promise<{ total: number; byConversation: Record<string, number> }> {
    // Get all conversations where user is participant
    const conversations = await this.conversationRepository.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
    });

    let total = 0;
    const byConversation: Record<string, number> = {};

    for (const conversation of conversations) {
      const unreadCount =
        conversation.user1Id === userId
          ? conversation.unreadCountUser1
          : conversation.unreadCountUser2;

      if (unreadCount > 0) {
        total += unreadCount;
        // Get the other user's ID for the conversation key
        const otherUserId =
          conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
        byConversation[otherUserId] = unreadCount;
      }
    }

    return { total, byConversation };
  }
}