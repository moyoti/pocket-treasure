/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TradeService } from './trade.service';
import { Trade, TradeStatus } from './entities/trade.entity';
import { TradeItem, TradeItemOwner } from './entities/trade-item.entity';
import { Friendship, FriendshipStatus } from '../friend/entities/friendship.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

describe('TradeService', () => {
  let service: TradeService;

  const mockTrade: Trade = {
    id: 'trade-1',
    initiatorId: 'user-1',
    receiverId: 'user-2',
    status: TradeStatus.PENDING,
    message: 'Trade offer',
    expiresAt: new Date(Date.now() + 24 * 3600000),
    completedAt: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Trade;

  const mockFriendship: Friendship = {
    id: 'f-1',
    requesterId: 'user-1',
    addresseeId: 'user-2',
    status: FriendshipStatus.ACCEPTED,
  } as Friendship;

  const mockInventoryItem: InventoryItem = {
    id: 'inv-1',
    userId: 'user-1',
    itemId: 'item-1',
    quantity: 5,
  } as InventoryItem;

  const mockTradeRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTradeItemRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFriendshipRepo = {
    findOne: jest.fn(),
  };

  const mockInventoryRepo = {
    findOne: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeService,
        {
          provide: getRepositoryToken(Trade),
          useValue: mockTradeRepo,
        },
        {
          provide: getRepositoryToken(TradeItem),
          useValue: mockTradeItemRepo,
        },
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockFriendshipRepo,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TradeService>(TradeService);

    jest.clearAllMocks();
    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
  });

  describe('createTrade', () => {
    it('should throw BadRequestException when trading with self', async () => {
      await expect(
        service.createTrade('user-1', {
          receiverId: 'user-1',
          initiatorItems: [],
          receiverItems: [],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when users are not friends', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createTrade('user-1', {
          receiverId: 'user-2',
          initiatorItems: [],
          receiverItems: [],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when pending trade exists', async () => {
      mockFriendshipRepo.findOne.mockResolvedValue(mockFriendship);
      mockTradeRepo.findOne.mockResolvedValue(mockTrade);

      await expect(
        service.createTrade('user-1', {
          receiverId: 'user-2',
          initiatorItems: [],
          receiverItems: [],
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getTradeById', () => {
    it('should return trade when user is participant', async () => {
      mockTradeRepo.findOne.mockResolvedValue(mockTrade);

      const result = await service.getTradeById('trade-1', 'user-1');

      expect(result).toEqual(mockTrade);
    });

    it('should throw NotFoundException when trade not found', async () => {
      mockTradeRepo.findOne.mockResolvedValue(null);

      await expect(service.getTradeById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user is not participant', async () => {
      mockTradeRepo.findOne.mockResolvedValue(mockTrade);

      await expect(service.getTradeById('trade-1', 'user-3')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('acceptTrade', () => {
    it('should throw BadRequestException when not the receiver', async () => {
      mockTradeRepo.findOne.mockResolvedValue({ ...mockTrade });

      await expect(service.acceptTrade('trade-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when trade is not pending', async () => {
      const acceptedTrade = { ...mockTrade, status: TradeStatus.ACCEPTED };
      mockTradeRepo.findOne.mockResolvedValue({ ...acceptedTrade });

      await expect(service.acceptTrade('trade-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should mark trade as expired if past expiration date', async () => {
      const expiredTrade = {
        ...mockTrade,
        expiresAt: new Date(Date.now() - 1000),
        items: [],
      };
      mockTradeRepo.findOne.mockResolvedValue(expiredTrade);
      mockTradeRepo.save.mockImplementation((t) => Promise.resolve(t));

      await expect(service.acceptTrade('trade-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectTrade', () => {
    it('should reject trade as receiver', async () => {
      const rejectedTrade = { ...mockTrade, status: TradeStatus.REJECTED };
      mockTradeRepo.findOne
        .mockResolvedValueOnce({ ...mockTrade }) // getTradeById in rejectTrade (copy to avoid mutation)
        .mockResolvedValueOnce(rejectedTrade); // getTradeById at return
      mockTradeRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.rejectTrade('trade-1', 'user-2');

      expect(result.status).toBe(TradeStatus.REJECTED);
    });

    it('should throw BadRequestException when not the receiver', async () => {
      mockTradeRepo.findOne.mockResolvedValue({ ...mockTrade });

      await expect(service.rejectTrade('trade-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelTrade', () => {
    it('should cancel trade as initiator', async () => {
      const cancelledTrade = { ...mockTrade, status: TradeStatus.CANCELLED };
      mockTradeRepo.findOne
        .mockResolvedValueOnce({ ...mockTrade }) // getTradeById in cancelTrade (copy)
        .mockResolvedValueOnce(cancelledTrade); // getTradeById at return
      mockTradeRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.cancelTrade('trade-1', 'user-1');

      expect(result.status).toBe(TradeStatus.CANCELLED);
    });

    it('should throw BadRequestException when not the initiator', async () => {
      mockTradeRepo.findOne.mockResolvedValue({ ...mockTrade });

      await expect(service.cancelTrade('trade-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when trade is not pending', async () => {
      const acceptedTrade = { ...mockTrade, status: TradeStatus.ACCEPTED };
      mockTradeRepo.findOne.mockResolvedValue({ ...acceptedTrade });

      await expect(service.cancelTrade('trade-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTrades', () => {
    it('should return filtered trades', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTrade]),
      };
      mockTradeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTrades('user-1', { type: 'all' } as any);

      expect(result).toEqual([mockTrade]);
    });

    it('should filter by sent trades', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTrade]),
      };
      mockTradeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTrades('user-1', { type: 'sent' } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'trade.initiatorId = :userId',
        { userId: 'user-1' },
      );
    });

    it('should filter by received trades', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockTradeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTrades('user-1', { type: 'received' } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'trade.receiverId = :userId',
        { userId: 'user-1' },
      );
    });
  });

  describe('expireTrades', () => {
    it('should expire pending trades past expiration', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };
      mockTradeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.expireTrades();

      expect(result).toBe(3);
    });

    it('should return 0 when no trades to expire', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      mockTradeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.expireTrades();

      expect(result).toBe(0);
    });
  });
});
