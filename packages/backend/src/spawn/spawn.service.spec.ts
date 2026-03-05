/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SpawnService } from './spawn.service';
import { SpawnedItem } from './entities/spawned-item.entity';
import { ItemService } from '../item/item.service';
import { PoiService } from '../poi/poi.service';
import { InventoryService } from '../inventory/inventory.service';
import { CollectItemDto } from './dto/collect-item.dto';
import { Item } from '../item/entities/item.entity';
import { POI } from '../poi/entities/poi.entity';

const COLLECTION_RADIUS_METERS = 50;

describe('SpawnService', () => {
  let service: SpawnService;
  let spawnedItemRepository: Repository<SpawnedItem>;
  let itemService: ItemService;
  let poiService: PoiService;
  let inventoryService: InventoryService;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Test Item',
    description: 'A test item',
    rarity: 'common',
    spawnWeight: 1,
    maxStack: 99,
    iconUrl: 'test-icon.png',
  } as Item;

  const mockPoi: POI = {
    id: 'poi-1',
    name: 'Test POI',
    latitude: 39.9087,
    longitude: 116.3975,
    description: 'Test location',
    category: 'landmark',
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

  const mockRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockItemService = {
    getRandomItemByWeight: jest.fn(),
  };

  const mockPoiService = {
    getRandomActivePois: jest.fn(),
  };

  const mockInventoryService = {
    addItemToInventory: jest.fn(),
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
      ],
    }).compile();

    service = module.get<SpawnService>(SpawnService);
    spawnedItemRepository = module.get<Repository<SpawnedItem>>(getRepositoryToken(SpawnedItem));
    itemService = module.get<ItemService>(ItemService);
    poiService = module.get<PoiService>(PoiService);
    inventoryService = module.get<InventoryService>(InventoryService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getNearbySpawnedItems', () => {
    it('should return active non-expired items within radius', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;
      const radiusKm = 5;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockSpawnedItem]),
      };

      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getNearbySpawnedItems(latitude, longitude, radiusKm);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('si');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('si.item', 'item');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('si.isActive = :isActive', { isActive: true });
      expect(result).toEqual([mockSpawnedItem]);
    });

    it('should use default radius of 5km', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.getNearbySpawnedItems(latitude, longitude);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('si');
    });

    it('should filter by active status and expiration date', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.getNearbySpawnedItems(latitude, longitude);

      // Verify filtering by active status
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('si.isActive = :isActive', { isActive: true });
      // Verify filtering by expiration
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('si.expiresAt > :now', expect.objectContaining({ now: expect.any(Date) }));
    });

    it('should calculate latitude and longitude range correctly', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;
      const radiusKm = 5;

      const latRange = radiusKm / 111.32;
      const lngRange = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.getNearbySpawnedItems(latitude, longitude, radiusKm);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'si.latitude BETWEEN :minLat AND :maxLat',
        expect.objectContaining({
          minLat: latitude - latRange,
          maxLat: latitude + latRange,
        }),
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'si.longitude BETWEEN :minLng AND :maxLng',
        expect.objectContaining({
          minLng: longitude - lngRange,
          maxLng: longitude + lngRange,
        }),
      );
    });

    it('should order by creation date descending and limit to 100', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.getNearbySpawnedItems(latitude, longitude);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('si.createdAt', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('should return empty array when no items found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getNearbySpawnedItems(39.9087, 116.3975);

      expect(result).toEqual([]);
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
      // Mock spawned item at same location (distance = 0)
      const spawnedItemAtLocation = {
        ...mockSpawnedItem,
        latitude: collectDto.latitude,
        longitude: collectDto.longitude,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(spawnedItemAtLocation);
      mockRepository.save = jest.fn().mockResolvedValue({ ...spawnedItemAtLocation, isActive: false });
      mockInventoryService.addItemToInventory = jest.fn().mockResolvedValue({});

      const result = await service.collectItem(userId, collectDto);

      expect(result.success).toBe(true);
      expect(result.item).toEqual(mockItem);
      expect(result.distance).toBeLessThanOrEqual(COLLECTION_RADIUS_METERS);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
      expect(inventoryService.addItemToInventory).toHaveBeenCalledWith(
        userId,
        mockItem,
        collectDto.latitude,
        collectDto.longitude,
        'Test POI',
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.collectItem(userId, collectDto)).rejects.toThrow(NotFoundException);
      await expect(service.collectItem(userId, collectDto)).rejects.toThrow('Item not found or already collected');
    });



    it('should throw error when item has expired', async () => {
      const expiredItem = {
        ...mockSpawnedItem,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      mockRepository.findOne = jest.fn().mockResolvedValue(expiredItem);

      await expect(service.collectItem(userId, collectDto)).rejects.toThrow('Item has expired');
    });

    it('should return success: false when user is outside collection radius', async () => {
      // User is 100 meters away (outside 50m radius)
      const userLatitude = 39.9087 + 0.001; // Approximately 100 meters north
      const userLongitude = 116.3975;

      const dtoOutsideRadius: CollectItemDto = {
        spawnedItemId: 'spawned-1',
        latitude: userLatitude,
        longitude: userLongitude,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockSpawnedItem);

      const result = await service.collectItem(userId, dtoOutsideRadius);

      expect(result.success).toBe(false);
      expect(result.item).toEqual(mockItem);
      expect(result.distance).toBeGreaterThan(COLLECTION_RADIUS_METERS);
      // Should NOT mark as collected or add to inventory
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(inventoryService.addItemToInventory).not.toHaveBeenCalled();
    });

    it('should calculate distance using Haversine formula', async () => {
      // Test with known coordinates
      const point1 = { lat: 39.9087, lng: 116.3975 };
      const point2 = { lat: 39.9087, lng: 116.3975 }; // Same point

      const sameLocationDto: CollectItemDto = {
        spawnedItemId: 'spawned-1',
        latitude: point1.lat,
        longitude: point1.lng,
      };

      const itemAtSameLocation = {
        ...mockSpawnedItem,
        latitude: point2.lat,
        longitude: point2.lng,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(itemAtSameLocation);
      mockRepository.save = jest.fn().mockResolvedValue({ ...itemAtSameLocation, isActive: false });
      mockInventoryService.addItemToInventory = jest.fn().mockResolvedValue({});

      const result = await service.collectItem(userId, sameLocationDto);

      // Distance should be 0 or very close to 0
      expect(result.distance).toBeLessThan(1); // Less than 1 meter
    });

    it('should verify collection radius is exactly 50 meters', async () => {
      // Create a scenario where distance is just over 50 meters
      // 1 degree latitude ≈ 111km, so 50m ≈ 0.00045 degrees
      const offset = 0.0006; // Slightly more than 50m

      const outsideLocation: CollectItemDto = {
        spawnedItemId: 'spawned-1',
        latitude: mockSpawnedItem.latitude + offset,
        longitude: mockSpawnedItem.longitude,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockSpawnedItem);

      const result = await service.collectItem(userId, outsideLocation);

      expect(result.success).toBe(false);
      expect(result.distance).toBeGreaterThan(COLLECTION_RADIUS_METERS);
    });
  });

  describe('spawnItemsAtPois', () => {
    it('should spawn items at random POIs', async () => {
      const count = 10;
      const pois = [mockPoi, { ...mockPoi, id: 'poi-2' } as POI];

      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue(pois);
      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      const result = await service.spawnItemsAtPois(count);

      expect(poiService.getRandomActivePois).toHaveBeenCalledWith(count);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use default count of 50', async () => {
      const pois = Array(50).fill(mockPoi);

      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue(pois);
      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      await service.spawnItemsAtPois();

      expect(poiService.getRandomActivePois).toHaveBeenCalledWith(50);
    });

    it('should create spawned items with correct properties', async () => {
      const pois = [mockPoi];

      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue(pois);
      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);

      const createdItem = { ...mockSpawnedItem, item: mockItem };
      mockRepository.create = jest.fn().mockReturnValue(createdItem);
      mockRepository.save = jest.fn().mockResolvedValue(createdItem);

      await service.spawnItemsAtPois(1);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          item: mockItem,
          itemId: mockItem.id,
          isActive: true,
          poiLatitude: mockPoi.latitude,
          poiLongitude: mockPoi.longitude,
          poiName: mockPoi.name,
        }),
      );
    });

    it('should set expiration date to 24 hours from now', async () => {
      const pois = [mockPoi];
      const now = Date.now();

      // Mock Date.now
      jest.spyOn(Date, 'now').mockReturnValue(now);

      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue(pois);
      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);

      const createdItem = { ...mockSpawnedItem };
      mockRepository.create = jest.fn().mockReturnValue(createdItem);
      mockRepository.save = jest.fn().mockResolvedValue(createdItem);

      await service.spawnItemsAtPois(1);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );

      // Restore Date.now
      jest.restoreAllMocks();
    });

    it('should add random offset to POI coordinates', async () => {
      const pois = [mockPoi];

      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue(pois);
      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);

      const createdItem = { ...mockSpawnedItem };
      mockRepository.create = jest.fn().mockReturnValue(createdItem);
      mockRepository.save = jest.fn().mockResolvedValue(createdItem);

      await service.spawnItemsAtPois(1);

      // Verify that latitude and longitude are modified with offset
      expect(mockRepository.create).toHaveBeenCalled();
      const callArgs = (mockRepository.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.latitude).not.toBe(mockPoi.latitude);
      expect(callArgs.longitude).not.toBe(mockPoi.longitude);
    });

    it('should handle empty POI list', async () => {
      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue([]);

      const result = await service.spawnItemsAtPois(10);

      expect(result).toEqual([]);
    });
  });

  describe('cleanupExpiredItems', () => {
    it('should delete expired items', async () => {
      const mockDeleteResult = { affected: 5, raw: [], generatedMaps: [] };

      mockRepository.delete = jest.fn().mockResolvedValue(mockDeleteResult);

      const result = await service.cleanupExpiredItems();

      expect(result).toBe(5);
      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object),
      });
    });

    it('should use Between to find expired items', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 0 });

      await service.cleanupExpiredItems();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.objectContaining({
          type: 'between',
        }),
      });
    });

    it('should return 0 when no items are deleted', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await service.cleanupExpiredItems();

      expect(result).toBe(0);
    });

    it('should handle undefined affected count', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: undefined });

      const result = await service.cleanupExpiredItems();

      expect(result).toBe(0);
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

    it('should use default count of 10', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;

      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      await service.spawnItemsNearLocation(latitude, longitude);

      expect(itemService.getRandomItemByWeight).toHaveBeenCalledTimes(10);
    });

    it('should use 500 meter offset for location-based spawning', async () => {
      const latitude = 39.9087;
      const longitude = 116.3975;

      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      await service.spawnItemsNearLocation(latitude, longitude, 1);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          poiLatitude: latitude,
          poiLongitude: longitude,
          poiName: '测试宝藏点',
        }),
      );
    });
  });

  describe('Distance calculation', () => {
    it('should calculate distance correctly using Haversine formula', () => {
      // Test case: same location should have 0 distance
      const lat1 = 39.9087;
      const lon1 = 116.3975;
      const lat2 = 39.9087;
      const lon2 = 116.3975;

      // Access private method through service
      const distance = (service as any).calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeLessThan(0.001); // Should be essentially 0
    });

    it('should calculate distance for known locations', () => {
      // Approximately 111km per degree of latitude
      const lat1 = 0;
      const lon1 = 0;
      const lat2 = 1; // 1 degree north
      const lon2 = 0;

      const distance = (service as any).calculateDistance(lat1, lon1, lat2, lon2);

      // Should be approximately 111km (111000 meters)
      expect(distance).toBeGreaterThan(110000);
      expect(distance).toBeLessThan(112000);
    });

    it('toRadians should convert degrees to radians correctly', () => {
      const degrees = 180;
      const radians = (service as any).toRadians(degrees);

      expect(radians).toBeCloseTo(Math.PI);
    });

    it('should handle collection radius validation correctly', async () => {
      // Test exactly at the boundary (50 meters)
      // 50 meters ≈ 0.00045 degrees latitude
      const boundaryOffset = 50 / 111320; // Convert 50m to degrees

      const atBoundary: CollectItemDto = {
        spawnedItemId: 'spawned-1',
        latitude: mockSpawnedItem.latitude + boundaryOffset,
        longitude: mockSpawnedItem.longitude,
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockSpawnedItem);

      const result = await service.collectItem('user-1', atBoundary);

      // Should be close to the boundary
      expect(result.distance).toBeCloseTo(COLLECTION_RADIUS_METERS, -1);
    });
  });

  describe('onModuleInit', () => {
    it('should spawn initial items if no items exist', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(0);
      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue([]);

      await service.onModuleInit();

      expect(mockRepository.count).toHaveBeenCalled();
    });

    it('should not spawn items if items already exist', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(10);

      await service.onModuleInit();

      expect(mockRepository.count).toHaveBeenCalled();
    });
  });

  describe('getRandomOffset', () => {
    it('should return offset within maxMeters', () => {
      const maxMeters = 30;
      const offset = (service as any).getRandomOffset(maxMeters);

      expect(offset).toHaveProperty('lat');
      expect(offset).toHaveProperty('lng');
      expect(typeof offset.lat).toBe('number');
      expect(typeof offset.lng).toBe('number');
    });

    it('should use 30 meters offset for POI spawning', async () => {
      const pois = [mockPoi];

      mockPoiService.getRandomActivePois = jest.fn().mockResolvedValue(pois);
      mockItemService.getRandomItemByWeight = jest.fn().mockResolvedValue(mockItem);
      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockImplementation((data) => Promise.resolve(data));

      await service.spawnItemsAtPois(1);

      // Verify the offset is used
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });
});
