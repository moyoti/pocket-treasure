/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { Friendship, FriendshipStatus } from '../friend/entities/friendship.entity';

describe('ChatService', () => {
  let service: ChatService;

  const mockUser1: User = {
    id: 'user-1',
    email: 'user1@test.com',
    username: 'user1',
    avatar: 'avatar1.png',
  } as User;

  const mockUser2: User = {
    id: 'user-2',
    email: 'user2@test.com',
    username: 'user2',
    avatar: null,
  } as User;

  const mockConversation: Conversation = {
    id: 'conv-1',
    user1Id: 'user-1',
    user2Id: 'user-2',
    lastMessageId: null,
    unreadCountUser1: 0,
    unreadCountUser2: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Conversation;

  const mockMessage: Message = {
    id: 'msg-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'Hello!',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    sender: mockUser1,
  } as unknown as Message;

  const mockFriendship: Friendship = {
    id: 'f-1',
    requesterId: 'user-1',
    addresseeId: 'user-2',
    status: FriendshipStatus.ACCEPTED,
  } as Friendship;

  const mockMessageRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockConversationRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockFriendshipRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepo,
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockFriendshipRepo,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);

    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message between friends', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockConversationRepo.findOne.mockResolvedValue(mockConversation);
      mockConversationRepo.save.mockImplementation((c) => Promise.resolve(c));
      mockMessageRepo.create.mockReturnValue(mockMessage);
      mockMessageRepo.save.mockResolvedValue(mockMessage);

      const result = await service.sendMessage('user-1', {
        receiverId: 'user-2',
        content: 'Hello!',
      });

      expect(result).toEqual(mockMessage);
    });

    it('should throw BadRequestException when sending to self', async () => {
      await expect(
        service.sendMessage('user-1', { receiverId: 'user-1', content: 'Hi' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when receiver not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', { receiverId: 'non-existent', content: 'Hi' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when users are not friends', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', { receiverId: 'user-2', content: 'Hi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create conversation if not exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockConversationRepo.findOne.mockResolvedValue(null); // No existing conversation
      mockConversationRepo.create.mockReturnValue(mockConversation);
      mockConversationRepo.save.mockImplementation((c) => Promise.resolve(c));
      mockMessageRepo.create.mockReturnValue(mockMessage);
      mockMessageRepo.save.mockResolvedValue(mockMessage);

      await service.sendMessage('user-1', { receiverId: 'user-2', content: 'Hello!' });

      expect(mockConversationRepo.create).toHaveBeenCalled();
    });

    it('should increment unread count for receiver', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockConversationRepo.findOne.mockResolvedValue({ ...mockConversation, unreadCountUser2: 0 });
      mockConversationRepo.save.mockImplementation((c) => Promise.resolve(c));
      mockMessageRepo.create.mockReturnValue(mockMessage);
      mockMessageRepo.save.mockResolvedValue(mockMessage);

      await service.sendMessage('user-1', { receiverId: 'user-2', content: 'Hello!' });

      expect(mockConversationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ unreadCountUser2: 1 }),
      );
    });
  });

  describe('getConversations', () => {
    it('should return conversations with details', async () => {
      mockConversationRepo.find.mockResolvedValue([mockConversation]);
      mockUserRepo.find.mockResolvedValue([mockUser2]);
      mockMessageRepo.find.mockResolvedValue([]);

      const result = await service.getConversations('user-1');

      expect(result.length).toBe(1);
      expect(result[0].otherUser).toEqual(mockUser2);
      expect(result[0].unreadCount).toBe(0);
    });

    it('should return empty array when no conversations', async () => {
      mockConversationRepo.find.mockResolvedValue([]);

      const result = await service.getConversations('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages between friends', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockMessageRepo.findAndCount.mockResolvedValue([[mockMessage], 1]);

      const result = await service.getMessages('user-1', 'user-2', 1, 50);

      expect(result.total).toBe(1);
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].content).toBe('Hello!');
    });

    it('should throw ForbiddenException when not friends', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(null);

      await expect(service.getMessages('user-1', 'user-3')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read and reset unread count', async () => {
      const convWithUnread = { ...mockConversation, unreadCountUser1: 5 };
      mockConversationRepo.findOne.mockResolvedValue(convWithUnread);
      mockConversationRepo.save.mockImplementation((c) => Promise.resolve(c));
      mockMessageRepo.update.mockResolvedValue({ affected: 5 });

      await service.markAsRead('user-1', 'conv-1');

      expect(mockMessageRepo.update).toHaveBeenCalled();
      expect(mockConversationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ unreadCountUser1: 0 }),
      );
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('user-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not part of conversation', async () => {
      mockConversationRepo.findOne.mockResolvedValue(mockConversation);

      await expect(service.markAsRead('user-3', 'conv-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return total and per-conversation unread counts', async () => {
      const convWithUnread = { ...mockConversation, unreadCountUser1: 3 };
      mockConversationRepo.find.mockResolvedValue([convWithUnread]);

      const result = await service.getUnreadCount('user-1');

      expect(result.total).toBe(3);
      expect(result.byConversation['user-2']).toBe(3);
    });

    it('should return zero when no unread messages', async () => {
      mockConversationRepo.find.mockResolvedValue([mockConversation]);

      const result = await service.getUnreadCount('user-1');

      expect(result.total).toBe(0);
      expect(Object.keys(result.byConversation).length).toBe(0);
    });
  });
});
