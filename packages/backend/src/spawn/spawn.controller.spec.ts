/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { SpawnController } from './spawn.controller';
import { SpawnService } from './spawn.service';

describe('SpawnController', () => {
  let controller: SpawnController;
  let spawnService: SpawnService;

  const mockSpawnService = {
    getNearbySpawnedItems: jest.fn(),
    getCurrentBonuses: jest.fn(),
    collectItem: jest.fn(),
    scheduledSpawn: jest.fn(),
    spawnItemsNearLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpawnController],
      providers: [
        {
          provide: SpawnService,
          useValue: mockSpawnService,
        },
      ],
    }).compile();

    controller = module.get<SpawnController>(SpawnController);
    spawnService = module.get<SpawnService>(SpawnService);

    jest.clearAllMocks();
  });

  describe('getNearbyItems', () => {
    it('should return nearby items with user ID', async () => {
      const mockItems = [{ id: 'item-1', latitude: 39.9, longitude: 116.3 }];
      mockSpawnService.getNearbySpawnedItems.mockResolvedValue(mockItems);

      const result = await controller.getNearbyItems(
        { user: { id: 'user-1' } },
        { lat: 39.9, lng: 116.3 },
      );

      expect(spawnService.getNearbySpawnedItems).toHaveBeenCalledWith(39.9, 116.3, 5, 'user-1');
      expect(result).toEqual(mockItems);
    });

    it('should use custom radius when provided', async () => {
      mockSpawnService.getNearbySpawnedItems.mockResolvedValue([]);

      await controller.getNearbyItems(
        { user: { id: 'user-1' } },
        { lat: 39.9, lng: 116.3, radius: 10 },
      );

      expect(spawnService.getNearbySpawnedItems).toHaveBeenCalledWith(39.9, 116.3, 10, 'user-1');
    });
  });

  describe('getCurrentBonuses', () => {
    it('should return current bonuses', async () => {
      const bonuses = { timeBonus: { name: 'normal' }, isWeekend: false, activeEvents: 0 };
      mockSpawnService.getCurrentBonuses.mockResolvedValue(bonuses);

      const result = await controller.getCurrentBonuses();

      expect(result).toEqual(bonuses);
    });
  });

  describe('collectItem', () => {
    it('should collect item and return result', async () => {
      const collectDto = { spawnedItemId: 'spawned-1', latitude: 39.9, longitude: 116.3 };
      const collectResult = { success: true, item: { id: 'item-1' }, distance: 10 };
      mockSpawnService.collectItem.mockResolvedValue(collectResult);

      const result = await controller.collectItem(
        { user: { id: 'user-1' } },
        collectDto,
      );

      expect(spawnService.collectItem).toHaveBeenCalledWith('user-1', collectDto);
      expect(result).toEqual(collectResult);
    });
  });

  describe('spawnItems', () => {
    it('should trigger scheduled spawn', async () => {
      mockSpawnService.scheduledSpawn.mockResolvedValue([]);

      await controller.spawnItems();

      expect(spawnService.scheduledSpawn).toHaveBeenCalled();
    });
  });

  describe('spawnNearbyItems', () => {
    it('should spawn items near location', async () => {
      const body = { latitude: 39.9, longitude: 116.3, count: 5 };
      mockSpawnService.spawnItemsNearLocation.mockResolvedValue([]);

      await controller.spawnNearbyItems(body);

      expect(spawnService.spawnItemsNearLocation).toHaveBeenCalledWith(39.9, 116.3, 5);
    });

    it('should use default count of 10', async () => {
      const body = { latitude: 39.9, longitude: 116.3 };
      mockSpawnService.spawnItemsNearLocation.mockResolvedValue([]);

      await controller.spawnNearbyItems(body as any);

      expect(spawnService.spawnItemsNearLocation).toHaveBeenCalledWith(39.9, 116.3, 10);
    });
  });
});
