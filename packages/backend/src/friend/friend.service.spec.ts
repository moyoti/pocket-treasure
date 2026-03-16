/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { FriendService } from './friend.service';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../user/entities/user.entity';

describe('FriendService', () => {
  let service: FriendService;

  const mockUser1: User = {
    id: 'user-1',
    email: 'user1@test.com',
    username: 'user1',
    isOnline: true,
  } as User;

  const mockUser2: User = {
    id: 'user-2',
    email: 'user2@test.com',
    username: 'user2',
    isOnline: false,
  } as User;

  const mockFriendship: Friendship = {
    id: 'friendship-1',
    requesterId: 'user-1',
    addresseeId: 'user-2',
    status: FriendshipStatus.PENDING,
    message: 'Hi!',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Friendship;

  const mockFriendshipRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendService,
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockFriendshipRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);

    jest.clearAllMocks();
  });

  describe('sendFriendRequest', () => {
    it('should create a new friend request', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue(null);
      mockFriendshipRepo.create.mockReturnValue(mockFriendship);
      mockFriendshipRepo.save.mockResolvedValue(mockFriendship);

      const result = await service.sendFriendRequest('user-1', {
        addresseeId: 'user-2',
        message: 'Hi!',
      });

      expect(result).toEqual(mockFriendship);
    });

    it('should throw BadRequestException when sending to self', async () => {
      await expect(
        service.sendFriendRequest('user-1', { addresseeId: 'user-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when addressee not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendFriendRequest('user-1', { addresseeId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already friends', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue({
        ...mockFriendship,
        status: FriendshipStatus.ACCEPTED,
      });

      await expect(
        service.sendFriendRequest('user-1', { addresseeId: 'user-2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when request already pending', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue({
        ...mockFriendship,
        status: FriendshipStatus.PENDING,
      });

      await expect(
        service.sendFriendRequest('user-1', { addresseeId: 'user-2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when user is blocked', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepo.findOne.mockResolvedValue({
        ...mockFriendship,
        status: FriendshipStatus.BLOCKED,
      });

      await expect(
        service.sendFriendRequest('user-1', { addresseeId: 'user-2' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept a pending friend request', async () => {
      const pendingFriendship = { ...mockFriendship, status: FriendshipStatus.PENDING };
      mockFriendshipRepo.findOne.mockResolvedValue(pendingFriendship);
      mockFriendshipRepo.save.mockImplementation((f) => Promise.resolve(f));

      const result = await service.acceptFriendRequest('user-2', 'friendship-1');

      expect(result.status).toBe(FriendshipStatus.ACCEPTED);
    });

    it('should throw NotFoundException when friendship not found', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(null);

      await expect(
        service.acceptFriendRequest('user-2', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when not the addressee', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);

      await expect(
        service.acceptFriendRequest('user-1', 'friendship-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when not pending', async () => {
      const acceptedFriendship = {
        ...mockFriendship,
        status: FriendshipStatus.ACCEPTED,
      };
      mockFriendshipRepo.findOne.mockResolvedValue(acceptedFriendship);

      await expect(
        service.acceptFriendRequest('user-2', 'friendship-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectFriendRequest', () => {
    it('should reject a pending friend request', async () => {
      const pendingFriendship = { ...mockFriendship, status: FriendshipStatus.PENDING };
      mockFriendshipRepo.findOne.mockResolvedValue(pendingFriendship);
      mockFriendshipRepo.save.mockImplementation((f) => Promise.resolve(f));

      await service.rejectFriendRequest('user-2', 'friendship-1');

      expect(mockFriendshipRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendshipStatus.REJECTED }),
      );
    });

    it('should throw BadRequestException when not the addressee', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);

      await expect(
        service.rejectFriendRequest('user-1', 'friendship-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFriend', () => {
    it('should remove friendship', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockFriendshipRepo.remove.mockResolvedValue(undefined);

      await service.removeFriend('user-1', 'friendship-1');

      expect(mockFriendshipRepo.remove).toHaveBeenCalledWith(mockFriendship);
    });

    it('should allow either user to remove', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockFriendshipRepo.remove.mockResolvedValue(undefined);

      await service.removeFriend('user-2', 'friendship-1');

      expect(mockFriendshipRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when friendship not found', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removeFriend('user-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not part of friendship', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);

      await expect(
        service.removeFriend('user-3', 'friendship-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFriends', () => {
    it('should return friends list with user details', async () => {
      const acceptedFriendship = {
        ...mockFriendship,
        status: FriendshipStatus.ACCEPTED,
      };
      mockFriendshipRepo.find.mockResolvedValue([acceptedFriendship]);
      mockUserRepo.find.mockResolvedValue([mockUser2]);

      const result = await service.getFriends('user-1');

      expect(result.length).toBe(1);
      expect(result[0].user).toEqual(mockUser2);
      expect(result[0].friendship).toEqual(acceptedFriendship);
    });

    it('should return empty array when no friends', async () => {
      mockFriendshipRepo.find.mockResolvedValue([]);

      const result = await service.getFriends('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending requests for addressee', async () => {
      mockFriendshipRepo.find.mockResolvedValue([mockFriendship]);

      const result = await service.getPendingRequests('user-2');

      expect(result).toEqual([mockFriendship]);
    });
  });

  describe('getOnlineFriends', () => {
    it('should return only online friends', async () => {
      const acceptedFriendship = {
        ...mockFriendship,
        status: FriendshipStatus.ACCEPTED,
      };
      mockFriendshipRepo.find.mockResolvedValue([acceptedFriendship]);
      mockUserRepo.find.mockResolvedValue([mockUser1]); // mockUser1 is online

      // user-2 looking at friends, user-1 is the friend (requesterId)
      const result = await service.getOnlineFriends('user-2');

      // user-1 is online
      expect(result.length).toBe(1);
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser2]),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchUsers('user-1', { query: 'user2' });

      expect(result).toEqual([mockUser2]);
    });

    it('should return empty array for empty query', async () => {
      const result = await service.searchUsers('user-1', { query: '' });

      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await service.searchUsers('user-1', { query: '   ' });

      expect(result).toEqual([]);
    });
  });

  describe('getFriendshipStatus', () => {
    it('should return friendship between two users', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);

      const result = await service.getFriendshipStatus('user-1', 'user-2');

      expect(result).toEqual(mockFriendship);
    });

    it('should return null when no friendship exists', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(null);

      const result = await service.getFriendshipStatus('user-1', 'user-3');

      expect(result).toBeNull();
    });
  });
});
