/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SpawnService } from './spawn.service';
import { SpawnedItem } from './entities/spawned-item.entity';
import { ItemService } from '../item/item.service';
import { PoiService } from '../poi/poi.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventService } from '../event/event.service';
import { UserService } from '../user/user.service';
import { CollectItemDto } from './dto/collect-item.dto';
import { Item, ItemRarity } from '../item/entities/item.entity';
import { POI } from '../poi/entities/poi.entity';
import { User } from '../user/entities/user.entity';

const COLLECTION_RADIUS_METERS = 50;

describe('SpawnService', () => {
  let service: SpawnService;
  let spawnedItemRepository: Repository<SpawnedItem>;
  let itemService: ItemService;
  let poiService: PoiService;
  let inventoryService: InventoryService;
  let eventService: EventService;
  let userService: UserService;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Test Item',
    description: 'A test item',
    rarity: 'common' as ItemRarity,
    spawnWeight: 1,
    maxStack: 99,
    iconUrl: 'test-icon.png',
  } as Item;

  const mockRareItem: Item = {
    id: 'item-rare',
    name: 'Rare Item',
    description: 'A rare item',
    rarity: 'rare' as ItemRarity,
    spawnWeight: 0.5,
    maxStack: 99,
    iconUrl: 'rare-icon.png',
  } as Item;

  const mockLegendaryItem: Item = {
    id: 'item-legendary',
    name: 'Legendary Item',
    description: 'A legendary item',
    rarity: 'legendary' as ItemRarity,
    spawnWeight: 0.05,
    maxStack: 99,
    iconUrl: 'legendary-icon.png',
  } as Item;

  const mockPoi: POI = {
    id: 'poi-1',
    name: 'Test POI',
    latitude: 39.9087,
    longitude: 116.3975,
    description: 'Test location',
    category: 'landmark',
    poiType: 'landmark',
    spawnWeight: 3.0,
    collectCount: 10,
    isActive: true,
  } as POI;

  const mockSpawnedItem: SpawnedItem = {
    id: 'spawned-1',
    latitude: 39.9087,
    longitude: 116.3975,
    item: mockItem,
    itemId: mockItem.id,
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    poiLatitude: 39.9087,
    poiLongitude: 116.3975,
    poiName: 'Test POI',
    createdAt: new Date(),
  } as SpawnedItem;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    luckyPoints: 10,
    loginStreak: 7,
  } as User;

  const mockRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockItemService = {
    getRandomItemByWeight: jest.fn(),
    findByRarity: jest.fn(),
    findById: jest.fn(),
  };

  const mockPoiService = {
    getRandomActivePois: jest.fn(),
    getPoisForSpawn: jest.fn(),
    getNearbyPois: jest.fn(),
    incrementCollectCount: jest.fn(),
  };

  const mockInventoryService = {
    addItemToInventory: jest.fn(),
  };

  const mockEventService = {
    getActiveEvents: jest.fn().mockResolvedValue([]),
    getActiveEventsForPoiType: jest.fn().mockResolvedValue([]),
    getCombinedRarityBonus: jest.fn().mockResolvedValue(0),
    getCombinedQuantityMultiplier: jest.fn().mockResolvedValue(1),
    getLegendaryRateBonus: jest.fn().mockResolvedValue(0),
    getActiveSpecialItems: jest.fn().mockResolvedValue([]),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpawnService,
        {
          provide: getRepositoryToken(SpawnedItem),
          useValue: mockRepository,
        },
        {
          provide: ItemService,
          useValue: mockItemService,
        },
        {
          provide: PoiService,
          useValue: mockPoiService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<SpawnService>(SpawnService);
    spawnedItemRepository = module.get<Repository<SpawnedItem>>(getRepositoryToken(SpawnedItem));
    itemService = module.get<ItemService>(ItemService);
    poiService = module.get<PoiService>(PoiService);
    inventoryService = module.get<InventoryService>(InventoryService);
    eventService = module.get<EventService>(EventService);
    userService = module.get<UserService>(UserService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('scheduledSpawn', () => {
    it('should spawn items at POIs with weights', async () => {
      const pois = [mockPoi, { ...mockPoi, id: 'poi-2', spawnWeight: 2.0 } as POI];

      mockPoiService.getPoisForSpawn = jest.fn().mockResolvedValue(pois);
      mockItemService.findByRarity = jest.fn().mockResolvedValue([mockItem]);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));
      mockEventService.getActiveEvents = jest.fn().mockResolvedValue([]);
      mockEventService.getCombinedQuantityMultiplier = jest.fn().mockResolvedValue(1);
      mockEventService.getLegendaryRateBonus = jest.fn().mockResolvedValue(0);
      mockEventService.getActiveSpecialItems = jest.fn().mockResolvedValue([]);

      const result = await service.scheduledSpawn();

      expect(poiService.getPoisForSpawn).toHaveBeenCalledWith(100);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should apply event quantity multiplier', async () => {
      mockPoiService.getPoisForSpawn = jest.fn().mockResolvedValue([mockPoi]);
      mockItemService.findByRarity = jest.fn().mockResolvedValue([mockItem]);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));
      mockEventService.getCombinedQuantityMultiplier = jest.fn().mockResolvedValue(2); // Double quantity

      const result = await service.scheduledSpawn();

      // With spawnWeight 3.0 and baseItemsPerPoi 3, we expect more items
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no POIs available', async () => {
      mockPoiService.getPoisForSpawn = jest.fn().mockResolvedValue([]);

      const result = await service.scheduledSpawn();

      expect(result).toEqual([]);
    });
  });

  describe('userTriggeredSpawn', () => {
    const userId = 'user-1';
    const latitude = 39.9087;
    const longitude = 116.3975;

    it('should spawn items when nearby items are below threshold', async () => {
      // Mock low nearby count
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5), // Below threshold
      };
      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      mockUserService.findById = jest.fn().mockResolvedValue(mockUser);
      mockPoiService.getNearbyPois = jest.fn().mockResolvedValue([mockPoi]);
      mockItemService.findByRarity = jest.fn().mockResolvedValue([mockItem]);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      const result = await service.userTriggeredSpawn(latitude, longitude, userId);

      expect(result.length).toBeGreaterThan(0);
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should not spawn items when nearby items are sufficient', async () => {
      // Mock high nearby count
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(20), // Above threshold
      };
      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.userTriggeredSpawn(latitude, longitude, userId);

      expect(result).toEqual([]);
    });

    it('should apply user lucky points to spawn', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const userWithLuckyPoints = { ...mockUser, luckyPoints: 25 };
      mockUserService.findById = jest.fn().mockResolvedValue(userWithLuckyPoints);
      mockPoiService.getNearbyPois = jest.fn().mockResolvedValue([mockPoi]);
      mockItemService.findByRarity = jest.fn().mockResolvedValue([mockRareItem]);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      await service.userTriggeredSpawn(latitude, longitude, userId);

      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should spawn at random locations when no POIs nearby', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      mockUserService.findById = jest.fn().mockResolvedValue(mockUser);
      mockPoiService.getNearbyPois = jest.fn().mockResolvedValue([]); // No POIs
      mockItemService.findByRarity = jest.fn().mockResolvedValue([mockItem]);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      const result = await service.userTriggeredSpawn(latitude, longitude, userId);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('calculateAdjustedRarityWeights', () => {
    it('should return base weights when no bonuses applied', () => {
      const weights = (service as any).calculateAdjustedRarityWeights(0, 0, 0);

      expect(weights.common).toBeCloseTo(70, 0);
      expect(weights.rare).toBeCloseTo(20, 0);
      expect(weights.epic).toBeCloseTo(8, 0);
      expect(weights.legendary).toBeCloseTo(2, 0);
    });

    it('should apply time rarity bonus', () => {
      const weights = (service as any).calculateAdjustedRarityWeights(10, 0, 0);

      // Time bonus should reduce common and increase rare+
      expect(weights.common).toBeLessThan(70);
      expect(weights.rare).toBeGreaterThan(20);
    });

    it('should apply lucky points', () => {
      const weights = (service as any).calculateAdjustedRarityWeights(0, 10, 0);

      // Lucky points should reduce common and increase rare+
      expect(weights.common).toBeLessThan(70);
    });

    it('should apply event legendary bonus', () => {
      const weights = (service as any).calculateAdjustedRarityWeights(0, 0, 100);

      // Legendary weight should be doubled
      expect(weights.legendary).toBeGreaterThan(2);
    });

    it('should apply multiple bonuses cumulatively', () => {
      const weights = (service as any).calculateAdjustedRarityWeights(10, 10, 50);

      expect(weights.common).toBeLessThan(70);
      expect(weights.legendary).toBeGreaterThan(2);
    });
  });

  describe('selectRarityByWeight', () => {
    it('should select common most of the time with base weights', () => {
      const weights = { common: 70, rare: 20, epic: 8, legendary: 2 };
      let commonCount = 0;

      for (let i = 0; i < 1000; i++) {
        const rarity = (service as any).selectRarityByWeight(weights);
        if (rarity === 'common') commonCount++;
      }

      // Should select common roughly 70% of the time
      expect(commonCount).toBeGreaterThan(600);
      expect(commonCount).toBeLessThan(800);
    });

    it('should select legendary more with adjusted weights', () => {
      const weights = { common: 50, rare: 25, epic: 15, legendary: 10 };
      let legendaryCount = 0;

      for (let i = 0; i < 1000; i++) {
        const rarity = (service as any).selectRarityByWeight(weights);
        if (rarity === 'legendary') legendaryCount++;
      }

      // Should select legendary roughly 10% of the time
      expect(legendaryCount).toBeGreaterThan(50);
      expect(legendaryCount).toBeLessThan(150);
    });
  });

  describe('getCurrentTimeBonus', () => {
    it('should return morning bonus during 6-9 AM', () => {
      const morningDate = new Date();
      morningDate.setHours(7, 0, 0, 0);

      const bonus = (service as any).getCurrentTimeBonus(morningDate);

      expect(bonus.name).toBe('morning');
      expect(bonus.rarityBonus).toBe(5);
    });

    it('should return golden hour bonus during 18-21', () => {
      const goldenDate = new Date();
      goldenDate.setHours(19, 0, 0, 0);

      const bonus = (service as any).getCurrentTimeBonus(goldenDate);

      expect(bonus.name).toBe('golden');
      expect(bonus.rarityBonus).toBe(10);
    });

    it('should return night bonus during 21-24', () => {
      const nightDate = new Date();
      nightDate.setHours(22, 0, 0, 0);

      const bonus = (service as any).getCurrentTimeBonus(nightDate);

      expect(bonus.name).toBe('night');
      expect(bonus.legendaryMultiplier).toBe(2);
    });

    it('should return normal bonus outside special hours', () => {
      const normalDate = new Date();
      normalDate.setHours(3, 0, 0, 0);

      const bonus = (service as any).getCurrentTimeBonus(normalDate);

      expect(bonus.name).toBe('normal');
      expect(bonus.rarityBonus).toBe(0);
    });
  });

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-01-06T12:00:00Z'); // Saturday
      const result = (service as any).isWeekend(saturday);
      expect(result).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-07T12:00:00Z'); // Sunday
      const result = (service as any).isWeekend(sunday);
      expect(result).toBe(true);
    });

    it('should return false for weekday', () => {
      const monday = new Date('2024-01-08T12:00:00Z'); // Monday
      const result = (service as any).isWeekend(monday);
      expect(result).toBe(false);
    });
  });

  describe('getNearbySpawnedItems', () => {
    it('should return items with simplified format', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(20),
        getMany: jest.fn().mockResolvedValue([mockSpawnedItem]),
      };
      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getNearbySpawnedItems(39.9087, 116.3975);

      expect(result).toEqual([{
        id: mockSpawnedItem.id,
        latitude: mockSpawnedItem.latitude,
        longitude: mockSpawnedItem.longitude,
        itemRarity: mockSpawnedItem.item.rarity,
        poiName: mockSpawnedItem.poiName,
        expiresAt: mockSpawnedItem.expiresAt,
        createdAt: mockSpawnedItem.createdAt,
      }]);
    });

    it('should trigger user spawn when items are low and userId provided', async () => {
      const userId = 'user-1';

      // Create a reusable mock query builder factory
      const createMockQueryBuilder = (getCountResult = 5, getManyResult = [mockSpawnedItem]) => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(getCountResult),
        getMany: jest.fn().mockResolvedValue(getManyResult),
      });

      // Need multiple query builders:
      // 1. countNearbySpawnedItems in getNearbySpawnedItems (returns 5)
      // 2. countNearbySpawnedItems in userTriggeredSpawn (returns 5)
      // 3. getNearbySpawnedItems main query (returns items)
      mockRepository.createQueryBuilder = jest.fn()
        .mockReturnValueOnce(createMockQueryBuilder(5)) // countNearbySpawnedItems
        .mockReturnValueOnce(createMockQueryBuilder(5)) // userTriggeredSpawn count
        .mockReturnValueOnce(createMockQueryBuilder(5, [mockSpawnedItem])); // main query

      mockUserService.findById = jest.fn().mockResolvedValue(mockUser);
      mockPoiService.getNearbyPois = jest.fn().mockResolvedValue([mockPoi]);
      mockItemService.findByRarity = jest.fn().mockResolvedValue([mockItem]);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      const result = await service.getNearbySpawnedItems(39.9087, 116.3975, 5, userId);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('collectItem', () => {
    const userId = 'user-1';
    const collectDto: CollectItemDto = {
      spawnedItemId: 'spawned-1',
      latitude: 39.9087,
      longitude: 116.3975,
    };

    it('should successfully collect item within collection radius', async () => {
      const spawnedItemAtLocation = {
        ...mockSpawnedItem,
        latitude: collectDto.latitude,
        longitude: collectDto.longitude,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(spawnedItemAtLocation);
      mockRepository.save = jest.fn().mockResolvedValue({ ...spawnedItemAtLocation, isActive: false });
      mockInventoryService.addItemToInventory = jest.fn().mockResolvedValue({});
      mockPoiService.getNearbyPois = jest.fn().mockResolvedValue([mockPoi]);
      mockPoiService.incrementCollectCount = jest.fn().mockResolvedValue(undefined);

      const result = await service.collectItem(userId, collectDto);

      expect(result.success).toBe(true);
      expect(result.item).toEqual(mockItem);
      expect(result.distance).toBeLessThanOrEqual(COLLECTION_RADIUS_METERS);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.collectItem(userId, collectDto)).rejects.toThrow(NotFoundException);
    });

    it('should return success: false when user is outside collection radius', async () => {
      const userLatitude = 39.9087 + 0.001;
      const dtoOutsideRadius: CollectItemDto = {
        spawnedItemId: 'spawned-1',
        latitude: userLatitude,
        longitude: 116.3975,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockSpawnedItem);

      const result = await service.collectItem(userId, dtoOutsideRadius);

      expect(result.success).toBe(false);
      expect(result.distance).toBeGreaterThan(COLLECTION_RADIUS_METERS);
    });

    it('should update POI collect count on successful collection', async () => {
      const spawnedItemAtLocation = {
        ...mockSpawnedItem,
        latitude: collectDto.latitude,
        longitude: collectDto.longitude,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(spawnedItemAtLocation);
      mockRepository.save = jest.fn().mockResolvedValue({ ...spawnedItemAtLocation, isActive: false });
      mockInventoryService.addItemToInventory = jest.fn().mockResolvedValue({});
      mockPoiService.getNearbyPois = jest.fn().mockResolvedValue([mockPoi]);
      mockPoiService.incrementCollectCount = jest.fn().mockResolvedValue(undefined);

      await service.collectItem(userId, collectDto);

      expect(poiService.incrementCollectCount).toHaveBeenCalledWith(mockPoi.id);
    });
  });

  describe('getCurrentBonuses', () => {
    it('should return current bonus information', async () => {
      mockEventService.getActiveEvents = jest.fn().mockResolvedValue([]);

      const result = await service.getCurrentBonuses();

      expect(result).toHaveProperty('timeBonus');
      expect(result).toHaveProperty('isWeekend');
      expect(result).toHaveProperty('activeEvents');
    });
  });

  describe('spawnItemsNearLocation', () => {
    it('should spawn items near specified location', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;
      const count = 5;

      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      const result = await service.spawnItemsNearLocation(latitude, longitude, count);

      expect(result.length).toBe(count);
      expect(itemService.getRandomItemByWeight).toHaveBeenCalledTimes(count);
    });
  });

  describe('cleanupExpiredItems', () => {
    it('should delete expired items', async () => {
      const mockDeleteResult = { affected: 5, raw: [], generatedMaps: [] };
      mockRepository.delete = jest.fn().mockResolvedValue(mockDeleteResult);

      const result = await service.cleanupExpiredItems();

      expect(result).toBe(5);
    });

    it('should return 0 when no items are deleted', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await service.cleanupExpiredItems();

      expect(result).toBe(0);
    });
  });

  describe('Distance calculation', () => {
    it('should calculate distance correctly using Haversine formula', () => {
      const lat1 = 39.9087;
      const lon1 = 116.3975;
      const lat2 = 39.9087;
      const lon2 = 116.3975;

      const distance = (service as any).calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeLessThan(0.001);
    });

    it('should calculate distance for known locations', () => {
      const lat1 = 0;
      const lon1 = 0;
      const lat2 = 1;
      const lon2 = 0;

      const distance = (service as any).calculateDistance(lat1, lon1, lat2, lon2);

      // Should be approximately 111km
      expect(distance).toBeGreaterThan(110000);
      expect(distance).toBeLessThan(112000);
    });
  });
});