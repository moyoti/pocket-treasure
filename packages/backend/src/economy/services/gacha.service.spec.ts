/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GachaService } from './gacha.service';
import { GachaPool } from '../entities/gacha-pool.entity';
import { GachaRecord } from '../entities/gacha-record.entity';
import { User } from '../../user/entities/user.entity';
import { Item, ItemRarity } from '../../item/entities/item.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { CoinService } from './coin.service';
import { PullType } from '../dto/pull-gacha.dto';

describe('GachaService', () => {
  let service: GachaService;

  const mockPool: GachaPool = {
    id: 'pool-1',
    name: '标准抽奖池',
    description: 'Standard pool',
    singlePrice: 100,
    tenPrice: 900,
    pityThreshold: 10,
    pityMinRarity: 'rare',
    isActive: true,
    items: [
      { rarity: 'common', weight: 60 },
      { rarity: 'rare', weight: 30 },
      { rarity: 'epic', weight: 8 },
      { rarity: 'legendary', weight: 2 },
    ],
  } as unknown as GachaPool;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Test Item',
    rarity: ItemRarity.COMMON,
    maxStack: 99,
  } as Item;

  const mockTransactionManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockGachaPoolRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation((cb) => cb(mockTransactionManager)),
    },
  };

  const mockGachaRecordRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation((cb) => cb(mockTransactionManager)),
    },
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockItemRepo = {
    find: jest.fn(),
  };

  const mockInventoryRepo = {
    findOne: jest.fn(),
  };

  const mockCoinService = {
    hasEnoughCoins: jest.fn(),
    spendCoins: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GachaService,
        {
          provide: getRepositoryToken(GachaPool),
          useValue: mockGachaPoolRepo,
        },
        {
          provide: getRepositoryToken(GachaRecord),
          useValue: mockGachaRecordRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepo,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryRepo,
        },
        {
          provide: CoinService,
          useValue: mockCoinService,
        },
      ],
    }).compile();

    service = module.get<GachaService>(GachaService);

    jest.clearAllMocks();
    mockGachaPoolRepo.manager.transaction.mockImplementation((cb) => cb(mockTransactionManager));
    mockGachaRecordRepo.manager.transaction.mockImplementation((cb) => cb(mockTransactionManager));
  });

  describe('getPools', () => {
    it('should return active gacha pools', async () => {
      mockGachaPoolRepo.count.mockResolvedValue(1);
      mockGachaPoolRepo.find.mockResolvedValue([mockPool]);

      const result = await service.getPools();

      expect(result).toEqual([mockPool]);
    });

    it('should initialize pools if none exist', async () => {
      mockGachaPoolRepo.count.mockResolvedValue(0);
      mockGachaPoolRepo.create.mockImplementation((data) => data);
      mockGachaPoolRepo.save.mockImplementation((data) => Promise.resolve(data));
      mockGachaPoolRepo.find.mockResolvedValue([mockPool]);

      const result = await service.getPools();

      expect(mockGachaPoolRepo.create).toHaveBeenCalled();
      expect(result).toEqual([mockPool]);
    });
  });

  describe('getPityCount', () => {
    it('should return 0 when no previous pulls', async () => {
      mockGachaRecordRepo.findOne.mockResolvedValue(null);

      const result = await service.getPityCount('user-1', 'pool-1');

      expect(result).toBe(0);
    });

    it('should return pity count from last record', async () => {
      mockGachaRecordRepo.findOne.mockResolvedValue({
        isPity: false,
        itemRarity: 'common',
        pityCount: 5,
      });

      const result = await service.getPityCount('user-1', 'pool-1');

      expect(result).toBe(5);
    });

    it('should return 0 if last pull was pity', async () => {
      mockGachaRecordRepo.findOne.mockResolvedValue({
        isPity: true,
        itemRarity: 'rare',
        pityCount: 10,
      });

      const result = await service.getPityCount('user-1', 'pool-1');

      expect(result).toBe(0);
    });

    it('should return 0 if last pull was high rarity', async () => {
      mockGachaRecordRepo.findOne.mockResolvedValue({
        isPity: false,
        itemRarity: 'epic',
        pityCount: 3,
      });

      const result = await service.getPityCount('user-1', 'pool-1');

      expect(result).toBe(0);
    });
  });

  describe('pull', () => {
    it('should throw NotFoundException for invalid pool', async () => {
      mockGachaPoolRepo.count.mockResolvedValue(1);
      mockGachaPoolRepo.findOne.mockResolvedValue(null);

      await expect(
        service.pull('user-1', { poolId: 'invalid', pullType: PullType.SINGLE }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient coins', async () => {
      mockGachaPoolRepo.count.mockResolvedValue(1);
      mockGachaPoolRepo.findOne.mockResolvedValue(mockPool);
      mockCoinService.hasEnoughCoins.mockResolvedValue(false);

      await expect(
        service.pull('user-1', { poolId: 'pool-1', pullType: PullType.SINGLE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should perform a single pull successfully', async () => {
      mockGachaPoolRepo.count.mockResolvedValue(1);
      mockGachaPoolRepo.findOne.mockResolvedValue(mockPool);
      mockCoinService.hasEnoughCoins.mockResolvedValue(true);
      mockCoinService.spendCoins.mockResolvedValue({ newBalance: 400 });
      mockGachaRecordRepo.findOne.mockResolvedValue(null); // no pity
      mockItemRepo.find.mockResolvedValue([mockItem]);
      mockTransactionManager.findOne.mockResolvedValue(null); // no existing inventory
      mockTransactionManager.create.mockImplementation((_, data) => data);
      mockTransactionManager.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.pull('user-1', { poolId: 'pool-1', pullType: PullType.SINGLE });

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(1);
      expect(result.coinsSpent).toBe(100);
    });

    it('should perform a ten pull successfully', async () => {
      mockGachaPoolRepo.count.mockResolvedValue(1);
      mockGachaPoolRepo.findOne.mockResolvedValue(mockPool);
      mockCoinService.hasEnoughCoins.mockResolvedValue(true);
      mockCoinService.spendCoins.mockResolvedValue({ newBalance: 100 });
      mockGachaRecordRepo.findOne.mockResolvedValue(null);
      mockItemRepo.find.mockResolvedValue([mockItem]);
      mockTransactionManager.findOne.mockResolvedValue(null);
      mockTransactionManager.create.mockImplementation((_, data) => data);
      mockTransactionManager.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.pull('user-1', { poolId: 'pool-1', pullType: PullType.TEN });

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(10);
      expect(result.coinsSpent).toBe(900);
    });
  });

  describe('getHistory', () => {
    it('should return gacha history', async () => {
      const mockRecords = [{ id: 'record-1' }];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRecords),
      };
      mockGachaRecordRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getHistory('user-1');

      expect(result).toEqual(mockRecords);
    });

    it('should filter by poolId when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockGachaRecordRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getHistory('user-1', 'pool-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'record.poolId = :poolId',
        { poolId: 'pool-1' },
      );
    });
  });
});
