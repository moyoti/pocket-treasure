import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopService } from './shop.service';
import { ShopItem, ShopItemCategory } from '../entities/shop-item.entity';
import { PurchaseRecord } from '../entities/purchase-record.entity';
import { CoinService, CoinTransactionSource } from './coin.service';
import { InventoryService } from '../../inventory/inventory.service';
import { ItemService } from '../../item/item.service';
import { User } from '../../user/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ShopService', () => {
  let service: ShopService;
  let shopItemRepository: jest.Mocked<Repository<ShopItem>>;
  let purchaseRecordRepository: jest.Mocked<Repository<PurchaseRecord>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let coinService: jest.Mocked<CoinService>;
  let inventoryService: jest.Mocked<InventoryService>;
  let itemService: jest.Mocked<ItemService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    username: 'testuser',
    coins: 1000,
    experience: 0,
    level: 1,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
  } as User;

  const mockShopItem: ShopItem = {
    id: 'item-1',
    name: 'Test Chest',
    description: 'A test chest',
    category: ShopItemCategory.CHEST,
    price: 100,
    rewards: { coins: 50, experience: 25 },
    isAvailable: true,
    purchaseLimit: 5,
    availableFrom: undefined,
    availableUntil: undefined,
    iconUrl: undefined,
    metadata: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ShopItem;

  beforeEach(async () => {
    const mockRepo = () => ({
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        {
          provide: getRepositoryToken(ShopItem),
          useFactory: mockRepo,
        },
        {
          provide: getRepositoryToken(PurchaseRecord),
          useFactory: mockRepo,
        },
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepo,
        },
        {
          provide: CoinService,
          useValue: {
            getBalance: jest.fn(),
            hasEnoughCoins: jest.fn(),
            deductCoins: jest.fn(),
            addCoins: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            addItemToInventory: jest.fn(),
          },
        },
        {
          provide: ItemService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
    shopItemRepository = module.get(getRepositoryToken(ShopItem));
    purchaseRecordRepository = module.get(getRepositoryToken(PurchaseRecord));
    userRepository = module.get(getRepositoryToken(User));
    coinService = module.get(CoinService);
    inventoryService = module.get(InventoryService);
    itemService = module.get(ItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getShopItems', () => {
    it('should return available shop items', async () => {
      shopItemRepository.find.mockResolvedValue([mockShopItem]);

      const result = await service.getShopItems();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Chest');
    });
  });

  describe('getShopItemById', () => {
    it('should return a shop item by id', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);

      const result = await service.getShopItemById('item-1');

      expect(result).toEqual(mockShopItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      shopItemRepository.findOne.mockResolvedValue(null);

      await expect(service.getShopItemById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('canPurchase', () => {
    it('should return true when user can purchase', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);
      coinService.hasEnoughCoins.mockResolvedValue(true);
      coinService.getBalance.mockResolvedValue(1000);

      const result = await service.canPurchase('user-1', 'item-1', 1);

      expect(result.canPurchase).toBe(true);
    });

    it('should return false when user has insufficient coins', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);
      coinService.hasEnoughCoins.mockResolvedValue(false);
      coinService.getBalance.mockResolvedValue(50);

      const result = await service.canPurchase('user-1', 'item-1', 1);

      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Insufficient coins');
    });

    it('should return false when daily purchase limit exceeded', async () => {
      const limitedItem: ShopItem = {
        ...mockShopItem,
        purchaseLimit: 1,
      } as unknown as ShopItem;
      shopItemRepository.findOne.mockResolvedValue(limitedItem);
      coinService.hasEnoughCoins.mockResolvedValue(true);
      coinService.getBalance.mockResolvedValue(1000);

      // Mock purchase count to 1 (already purchased once today)
      purchaseRecordRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      } as any);

      const result = await service.canPurchase('user-1', 'item-1', 1);

      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Daily purchase limit');
    });
  });

  describe('purchaseItem', () => {
    it('should successfully purchase an item', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);
      coinService.hasEnoughCoins.mockResolvedValue(true);
      coinService.getBalance.mockResolvedValue(1000);
      coinService.deductCoins.mockResolvedValue({
        success: true,
        previousBalance: 1000,
        newBalance: 900,
        amount: 100,
      });
      coinService.addCoins.mockResolvedValue({
        success: true,
        previousBalance: 900,
        newBalance: 950,
        amount: 50,
      });
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      purchaseRecordRepository.create.mockReturnValue({} as PurchaseRecord);
      purchaseRecordRepository.save.mockResolvedValue({} as PurchaseRecord);

      const result = await service.purchaseItem('user-1', {
        shopItemId: 'item-1',
        quantity: 1,
      });

      expect(result.success).toBe(true);
      expect(result.rewards.coins).toBe(50);
      expect(result.rewards.experience).toBe(25);
    });

    it('should throw BadRequestException when cannot purchase', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);
      coinService.hasEnoughCoins.mockResolvedValue(false);
      coinService.getBalance.mockResolvedValue(50);

      await expect(
        service.purchaseItem('user-1', { shopItemId: 'item-1', quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});