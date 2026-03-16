/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashed',
    avatar: 'avatar.png',
    googleId: null,
    appleId: null,
    isVerified: true,
    role: 'user',
    isOnline: false,
    lastSeenAt: null,
    socketId: null,
    coins: 100,
    totalCoinsEarned: 200,
    totalCoinsSpent: 100,
    experience: 50,
    level: 1,
    lastLoginDate: new Date(),
    loginStreak: 5,
    luckyPoints: 10,
    preferences: null,
    inventoryItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and return updated user', async () => {
      const updateData = { username: 'newname' };
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({ ...mockUser, username: 'newname' });

      const result = await service.updateProfile('user-1', updateData);

      expect(userRepository.update).toHaveBeenCalledWith('user-1', updateData);
      expect(result.username).toBe('newname');
    });

    it('should throw NotFoundException if user not found after update', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent', { username: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar and return updated user', async () => {
      const newAvatar = 'new-avatar.png';
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({ ...mockUser, avatar: newAvatar });

      const result = await service.updateAvatar('user-1', newAvatar);

      expect(userRepository.update).toHaveBeenCalledWith('user-1', { avatar: newAvatar });
      expect(result.avatar).toBe(newAvatar);
    });
  });

  describe('getUserStats', () => {
    it('should return user stats with collection count', async () => {
      const mockRawResult = {
        userId: 'user-1',
        coins: 100,
        experience: 50,
        level: 2,
        loginStreak: 5,
        collectionCount: '15',
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawResult),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserStats('user-1');

      expect(result).toEqual({
        coins: 100,
        experience: 50,
        level: 2,
        loginStreak: 5,
        collectionCount: 15,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.getUserStats('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return default values for null fields', async () => {
      const mockRawResult = {
        userId: 'user-1',
        coins: null,
        experience: null,
        level: null,
        loginStreak: null,
        collectionCount: null,
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawResult),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserStats('user-1');

      expect(result).toEqual({
        coins: 0,
        experience: 0,
        level: 1,
        loginStreak: 0,
        collectionCount: 0,
      });
    });
  });
});
