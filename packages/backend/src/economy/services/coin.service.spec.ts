/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CoinService, CoinTransactionSource, CoinTransactionType } from './coin.service';
import { User } from '../../user/entities/user.entity';
import { CoinTransaction } from '../entities/coin-transaction.entity';

describe('CoinService', () => {
  let service: CoinService;

  const mockUser = {
    id: 'user-1',
    coins: 500,
    totalCoinsEarned: 1000,
    totalCoinsSpent: 500,
  };

  const mockTransactionManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation((cb) => cb(mockTransactionManager)),
    },
  };

  const mockTransactionRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(CoinTransaction),
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    service = module.get<CoinService>(CoinService);

    jest.clearAllMocks();
    mockUserRepo.manager.transaction.mockImplementation((cb) => cb(mockTransactionManager));
  });

  describe('getBalance', () => {
    it('should return user coin balance', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getBalance('user-1');

      expect(result).toBe(500);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getBalance('non-existent')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addCoins', () => {
    it('should add coins to user balance', async () => {
      mockTransactionManager.findOne.mockResolvedValue({ ...mockUser });
      mockTransactionManager.create.mockReturnValue({});
      mockTransactionManager.save.mockResolvedValue({});

      const result = await service.addCoins('user-1', 100, CoinTransactionSource.DAILY_TASK);

      expect(result.success).toBe(true);
      expect(result.previousBalance).toBe(500);
      expect(result.newBalance).toBe(600);
      expect(result.amount).toBe(100);
    });

    it('should throw BadRequestException when amount is not positive', async () => {
      await expect(
        service.addCoins('user-1', 0, CoinTransactionSource.DAILY_TASK),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.addCoins('user-1', -10, CoinTransactionSource.DAILY_TASK),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockTransactionManager.findOne.mockResolvedValue(null);

      await expect(
        service.addCoins('non-existent', 100, CoinTransactionSource.DAILY_TASK),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate transaction error', async () => {
      mockTransactionManager.findOne.mockResolvedValue({ ...mockUser });
      mockTransactionManager.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.addCoins('user-1', 100, CoinTransactionSource.DAILY_TASK),
      ).rejects.toThrow('DB error');
    });
  });

  describe('deductCoins', () => {
    it('should deduct coins from user balance', async () => {
      mockTransactionManager.findOne.mockResolvedValue({ ...mockUser });
      mockTransactionManager.create.mockReturnValue({});
      mockTransactionManager.save.mockResolvedValue({});

      const result = await service.deductCoins('user-1', 100, CoinTransactionSource.SHOP_PURCHASE);

      expect(result.success).toBe(true);
      expect(result.previousBalance).toBe(500);
      expect(result.newBalance).toBe(400);
    });

    it('should throw BadRequestException when insufficient coins', async () => {
      mockTransactionManager.findOne.mockResolvedValue({ ...mockUser, coins: 50 });

      await expect(
        service.deductCoins('user-1', 100, CoinTransactionSource.SHOP_PURCHASE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount is not positive', async () => {
      await expect(
        service.deductCoins('user-1', 0, CoinTransactionSource.SHOP_PURCHASE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('spendCoins', () => {
    it('should be an alias for deductCoins', async () => {
      mockTransactionManager.findOne.mockResolvedValue({ ...mockUser });
      mockTransactionManager.create.mockReturnValue({});
      mockTransactionManager.save.mockResolvedValue({});

      const result = await service.spendCoins('user-1', 50, CoinTransactionSource.GACHA);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(450);
    });
  });

  describe('hasEnoughCoins', () => {
    it('should return true when user has enough coins', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.hasEnoughCoins('user-1', 100);

      expect(result).toBe(true);
    });

    it('should return false when user does not have enough coins', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.hasEnoughCoins('user-1', 1000);

      expect(result).toBe(false);
    });

    it('should return true for exact balance', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.hasEnoughCoins('user-1', 500);

      expect(result).toBe(true);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [{ id: 'txn-1', amount: 100 }];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTransactions, 1]),
      };
      mockTransactionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTransactionHistory('user-1', 20, 0);

      expect(result.transactions).toEqual(mockTransactions);
      expect(result.total).toBe(1);
    });
  });

  describe('getTransactions', () => {
    it('should filter by type and source', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockTransactionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTransactions('user-1', {
        type: CoinTransactionType.EARN,
        source: CoinTransactionSource.DAILY_TASK,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCoinStats', () => {
    it('should return coin statistics', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getCoinStats('user-1');

      expect(result).toEqual({
        balance: 500,
        totalEarned: 1000,
        totalSpent: 500,
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getCoinStats('non-existent')).rejects.toThrow(BadRequestException);
    });

    it('should default to 0 for null values', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        totalCoinsEarned: null,
        totalCoinsSpent: null,
      });

      const result = await service.getCoinStats('user-1');

      expect(result.totalEarned).toBe(0);
      expect(result.totalSpent).toBe(0);
    });
  });
});
