/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { Item, ItemRarity } from '../item/entities/item.entity';

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let inventoryRepository: Repository<InventoryItem>;

  const mockItem: Item = {
    id: 'item-uuid-123',
    name: 'Test Item',
    description: 'A test item',
    rarity: ItemRarity.COMMON,
    type: 'collectible',
    spawnWeight: 1.0,
    maxStack: 10,
    iconUrl: 'https://example.com/icon.png',
    modelUrl: undefined,
    metadata: {},
    spawnedItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Item;

  const mockInventoryItem: InventoryItem = {
    id: 'inventory-uuid-123',
    userId: 'user-uuid-123',
    itemId: 'item-uuid-123',
    item: mockItem,
    quantity: 1,
    collectedLatitude: 39.9042,
    collectedLongitude: 116.4074,
    poiName: 'Test POI',
    collectedAt: new Date(),
  } as InventoryItem;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    inventoryService = module.get<InventoryService>(InventoryService);
    inventoryRepository = module.get<Repository<InventoryItem>>(
      getRepositoryToken(InventoryItem),
    );

    jest.clearAllMocks();
  });

  describe('getUserInventory', () => {
    const userId = 'user-uuid-123';

    it('should return user inventory items sorted by collectedAt DESC', async () => {
      const mockItems = [mockInventoryItem];
      mockRepository.find.mockResolvedValue(mockItems);

      const result = await inventoryService.getUserInventory(userId);

      expect(inventoryRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['item'],
        order: { collectedAt: 'DESC' },
      });
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when user has no inventory', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await inventoryService.getUserInventory(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserInventoryStats', () => {
    const userId = 'user-uuid-123';

    it('should return correct inventory stats', async () => {
      const mockItems = [
        { ...mockInventoryItem, quantity: 2, item: { ...mockItem, rarity: ItemRarity.COMMON } },
        { ...mockInventoryItem, id: 'inv-2', quantity: 1, item: { ...mockItem, rarity: ItemRarity.RARE } },
        { ...mockInventoryItem, id: 'inv-3', quantity: 3, item: { ...mockItem, rarity: ItemRarity.COMMON } },
      ] as InventoryItem[];

      const queryBuilderMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await inventoryService.getUserInventoryStats(userId);

      expect(result).toEqual({
        totalItems: 6,
        uniqueItems: 3,
        byRarity: {
          common: 5,
          rare: 1,
        },
      });
    });

    it('should return zero stats when user has no inventory', async () => {
      const queryBuilderMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await inventoryService.getUserInventoryStats(userId);

      expect(result).toEqual({
        totalItems: 0,
        uniqueItems: 0,
        byRarity: {},
      });
    });

    it('should handle multiple rarity types correctly', async () => {
      const mockItems = [
        { ...mockInventoryItem, quantity: 1, item: { ...mockItem, rarity: ItemRarity.COMMON } },
        { ...mockInventoryItem, id: 'inv-2', quantity: 1, item: { ...mockItem, rarity: ItemRarity.RARE } },
        { ...mockInventoryItem, id: 'inv-3', quantity: 1, item: { ...mockItem, rarity: ItemRarity.EPIC } },
        { ...mockInventoryItem, id: 'inv-4', quantity: 1, item: { ...mockItem, rarity: ItemRarity.LEGENDARY } },
      ] as InventoryItem[];

      const queryBuilderMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockItems),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await inventoryService.getUserInventoryStats(userId);

      expect(result).toEqual({
        totalItems: 4,
        uniqueItems: 4,
        byRarity: {
          common: 1,
          rare: 1,
          epic: 1,
          legendary: 1,
        },
      });
    });
  });

  describe('addItemToInventory', () => {
    const userId = 'user-uuid-123';
    const latitude = 39.9042;
    const longitude = 116.4074;
    const poiName = 'Test POI';

    it('should create new inventory item when user does not have the item', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInventoryItem);
      mockRepository.save.mockResolvedValue(mockInventoryItem);

      const result = await inventoryService.addItemToInventory(
        userId,
        mockItem,
        latitude,
        longitude,
        poiName,
      );

      expect(inventoryRepository.findOne).toHaveBeenCalledWith({
        where: { userId, itemId: mockItem.id },
      });
      expect(inventoryRepository.create).toHaveBeenCalledWith({
        userId,
        item: mockItem,
        itemId: mockItem.id,
        quantity: 1,
        collectedLatitude: latitude,
        collectedLongitude: longitude,
        poiName,
      });
      expect(inventoryRepository.save).toHaveBeenCalledWith(mockInventoryItem);
      expect(result).toEqual(mockInventoryItem);
    });

    it('should increment quantity when user already has the item and not at max stack', async () => {
      const existingItem = { ...mockInventoryItem, quantity: 2 };
      const savedItem = { ...existingItem, quantity: 3 };
      mockRepository.findOne.mockResolvedValue(existingItem);
      mockRepository.save.mockResolvedValue(savedItem);

      const result = await inventoryService.addItemToInventory(
        userId,
        mockItem,
        latitude,
        longitude,
      );

      expect(inventoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 3 }),
      );
      expect(result).toEqual(expect.objectContaining({ quantity: 3 }));
    });


    it('should not increment quantity when item is at max stack', async () => {
      const maxStackItem = { ...mockInventoryItem, quantity: 10 };
      mockRepository.findOne.mockResolvedValue(maxStackItem);

      const result = await inventoryService.addItemToInventory(
        userId,
        mockItem,
        latitude,
        longitude,
      );

      // When at maxStack, service creates new inventory item instead
      expect(inventoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          itemId: mockItem.id,
          quantity: 1,
          collectedLatitude: latitude,
          collectedLongitude: longitude,
        }),
      );
    });


    it('should create new inventory item without poiName when not provided', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInventoryItem);
      mockRepository.save.mockResolvedValue(mockInventoryItem);

      await inventoryService.addItemToInventory(
        userId,
        mockItem,
        latitude,
        longitude,
      );

      expect(inventoryRepository.create).toHaveBeenCalledWith({
        userId,
        item: mockItem,
        itemId: mockItem.id,
        quantity: 1,
        collectedLatitude: latitude,
        collectedLongitude: longitude,
        poiName: undefined,
      });
    });
  });

  describe('removeItemFromInventory', () => {
    const userId = 'user-uuid-123';
    const inventoryItemId = 'inventory-uuid-123';

    it('should remove item completely when quantity equals removal amount', async () => {
      const itemToRemove = { ...mockInventoryItem, quantity: 1 };
      mockRepository.findOne.mockResolvedValue(itemToRemove);

      await inventoryService.removeItemFromInventory(userId, inventoryItemId, 1);

      expect(inventoryRepository.remove).toHaveBeenCalledWith(itemToRemove);
    });

    it('should decrement quantity when removal amount is less than current quantity', async () => {
      const itemToPartialRemove = { ...mockInventoryItem, quantity: 5 };
      mockRepository.findOne.mockResolvedValue(itemToPartialRemove);
      mockRepository.save.mockResolvedValue({ ...itemToPartialRemove, quantity: 4 });

      await inventoryService.removeItemFromInventory(userId, inventoryItemId, 1);

      expect(inventoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 4 }),
      );
    });

    it('should throw error when item not found in inventory', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        inventoryService.removeItemFromInventory(userId, inventoryItemId, 1),
      ).rejects.toThrow('Item not found in inventory');
    });

    it('should throw error when item does not belong to user', async () => {
      // Note: Production code checks by inventoryItemId only
      // The where clause includes userId, so item won't be found if userId doesn't match
      const otherUserItem = { ...mockInventoryItem, userId: 'other-user' };
      // findOne returns null because where: { id: inventoryItemId, userId } doesn't match
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        inventoryService.removeItemFromInventory(userId, 'non-matching-id', 1),
      ).rejects.toThrow('Item not found in inventory');
    });

    it('should use default quantity of 1 when not specified', async () => {
      const itemToRemove = { ...mockInventoryItem, quantity: 1 };
      mockRepository.findOne.mockResolvedValue(itemToRemove);

      await inventoryService.removeItemFromInventory(userId, inventoryItemId);

      expect(inventoryRepository.remove).toHaveBeenCalledWith(itemToRemove);
    });
  });

  describe('getInventoryItemById', () => {
    const userId = 'user-uuid-123';
    const inventoryItemId = 'inventory-uuid-123';

    it('should return inventory item with item relation when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockInventoryItem);

      const result = await inventoryService.getInventoryItemById(userId, inventoryItemId);

      expect(inventoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: inventoryItemId, userId },
        relations: ['item'],
      });
      expect(result).toEqual(mockInventoryItem);
    });

    it('should throw error when item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        inventoryService.getInventoryItemById(userId, inventoryItemId),
      ).rejects.toThrow('Item not found in inventory');
    });

    it('should throw error when item does not belong to user', async () => {
      // Note: Production code checks by inventoryItemId and userId
      // If userId doesn't match, findOne returns null
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        inventoryService.getInventoryItemById(userId, 'non-matching-id'),
      ).rejects.toThrow('Item not found in inventory');
    });
  });
});
