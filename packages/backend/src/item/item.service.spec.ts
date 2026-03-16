/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ItemService } from './item.service';
import { Item, ItemRarity, ItemType } from './entities/item.entity';

describe('ItemService', () => {
  let service: ItemService;
  let itemRepository: Repository<Item>;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Test Item',
    description: 'A test item',
    rarity: ItemRarity.COMMON,
    type: ItemType.COLLECTIBLE,
    spawnWeight: 1.0,
    maxStack: 10,
    iconUrl: 'icon.png',
    modelUrl: null,
    metadata: {},
    canTrade: true,
    spawnedItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Item;

  const mockRareItem: Item = {
    ...mockItem,
    id: 'item-2',
    name: 'Rare Item',
    rarity: ItemRarity.RARE,
    spawnWeight: 0.5,
  } as unknown as Item;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new item', async () => {
      const createDto = {
        name: 'New Item',
        description: 'A new item',
        rarity: ItemRarity.COMMON,
      };
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      const result = await service.create(createDto as any);

      expect(itemRepository.create).toHaveBeenCalledWith(createDto);
      expect(itemRepository.save).toHaveBeenCalledWith(mockItem);
      expect(result).toEqual(mockItem);
    });
  });

  describe('findAll', () => {
    it('should return all items sorted by rarity and name', async () => {
      const items = [mockItem, mockRareItem];
      mockRepository.find.mockResolvedValue(items);

      const result = await service.findAll();

      expect(itemRepository.find).toHaveBeenCalledWith({
        order: { rarity: 'ASC', name: 'ASC' },
      });
      expect(result).toEqual(items);
    });

    it('should return empty array when no items exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByRarity', () => {
    it('should return items of specified rarity', async () => {
      mockRepository.find.mockResolvedValue([mockRareItem]);

      const result = await service.findByRarity(ItemRarity.RARE);

      expect(itemRepository.find).toHaveBeenCalledWith({
        where: { rarity: ItemRarity.RARE },
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockRareItem]);
    });
  });

  describe('findById', () => {
    it('should return item when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockItem);

      const result = await service.findById('item-1');

      expect(itemRepository.findOne).toHaveBeenCalledWith({ where: { id: 'item-1' } });
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('non-existent')).rejects.toThrow('Item not found');
    });
  });

  describe('getRandomItemByWeight', () => {
    it('should return a random item based on weight', async () => {
      const items = [
        { ...mockItem, spawnWeight: 10 },
        { ...mockRareItem, spawnWeight: 1 },
      ];
      mockRepository.find.mockResolvedValue(items);

      const result = await service.getRandomItemByWeight();

      expect(result).toBeDefined();
      expect(items).toContainEqual(result);
    });

    it('should throw NotFoundException when no items available', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.getRandomItemByWeight()).rejects.toThrow(NotFoundException);
    });

    it('should respect spawn weights (statistical test)', async () => {
      const heavyItem = { ...mockItem, id: 'heavy', spawnWeight: 90 };
      const lightItem = { ...mockRareItem, id: 'light', spawnWeight: 10 };
      mockRepository.find.mockResolvedValue([heavyItem, lightItem]);

      let heavyCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = await service.getRandomItemByWeight();
        if (result.id === 'heavy') heavyCount++;
      }

      // Heavy item should be selected ~90% of time
      expect(heavyCount).toBeGreaterThan(70);
    });
  });

  describe('seedItems', () => {
    it('should create items that do not exist', async () => {
      const itemData = [{ name: 'New Seed Item' }];
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      await service.seedItems(itemData);

      expect(itemRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'New Seed Item' },
      });
      expect(itemRepository.create).toHaveBeenCalled();
      expect(itemRepository.save).toHaveBeenCalled();
    });

    it('should skip items that already exist', async () => {
      const itemData = [{ name: 'Existing Item' }];
      mockRepository.findOne.mockResolvedValue(mockItem);

      await service.seedItems(itemData);

      expect(itemRepository.create).not.toHaveBeenCalled();
      expect(itemRepository.save).not.toHaveBeenCalled();
    });
  });
});
