/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardService } from './leaderboard.service';
import { User } from '../user/entities/user.entity';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let userRepository: Repository<User>;

  const mockRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('getTopPlayers', () => {
    it('should return top players sorted by collection count', async () => {
      const mockRawUsers = [
        { userId: 'user-1', username: 'player1', avatar: 'avatar1.png', collectionCount: '50' },
        { userId: 'user-2', username: 'player2', avatar: null, collectionCount: '30' },
        { userId: 'user-3', username: 'player3', avatar: 'avatar3.png', collectionCount: '10' },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawUsers),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopPlayers(10);

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({
        rank: 1,
        userId: 'user-1',
        username: 'player1',
        avatar: 'avatar1.png',
        collectionCount: 50,
        rareItems: 0,
        epicItems: 0,
        legendaryItems: 0,
      });
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('should return empty array when no users', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopPlayers();

      expect(result).toEqual([]);
    });

    it('should use default limit of 10', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTopPlayers();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should handle null collectionCount as 0', async () => {
      const mockRawUsers = [
        { userId: 'user-1', username: 'newplayer', avatar: null, collectionCount: null },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawUsers),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopPlayers();

      expect(result[0].collectionCount).toBe(0);
    });
  });

  describe('getUserRank', () => {
    it('should return correct rank for user', async () => {
      const mockRawUsers = [
        { userId: 'user-1', collectionCount: '50' },
        { userId: 'user-2', collectionCount: '30' },
        { userId: 'user-3', collectionCount: '10' },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawUsers),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const rank = await service.getUserRank('user-2');

      expect(rank).toBe(2);
    });

    it('should return 0 for non-existent user', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const rank = await service.getUserRank('non-existent');

      expect(rank).toBe(0);
    });

    it('should return rank 1 for top player', async () => {
      const mockRawUsers = [
        { userId: 'top-user', collectionCount: '100' },
        { userId: 'user-2', collectionCount: '50' },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawUsers),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const rank = await service.getUserRank('top-user');

      expect(rank).toBe(1);
    });
  });
});
