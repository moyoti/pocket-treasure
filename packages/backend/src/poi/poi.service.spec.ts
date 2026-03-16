/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoiService } from './poi.service';
import { POI } from './entities/poi.entity';

describe('PoiService', () => {
  let service: PoiService;
  let poiRepository: Repository<POI>;

  const mockPoi: POI = {
    id: 'poi-1',
    name: 'Test POI',
    latitude: 39.9087,
    longitude: 116.3975,
    description: 'A test POI',
    poiType: 'landmark',
    isActive: true,
    spawnWeight: 3.0,
    collectCount: 10,
  } as POI;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoiService,
        {
          provide: getRepositoryToken(POI),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PoiService>(PoiService);
    poiRepository = module.get<Repository<POI>>(getRepositoryToken(POI));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active POIs sorted by name', async () => {
      mockRepository.find.mockResolvedValue([mockPoi]);

      const result = await service.findAll();

      expect(poiRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockPoi]);
    });
  });

  describe('getNearbyPois', () => {
    it('should return POIs within specified radius', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPoi]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getNearbyPois(39.9087, 116.3975, 10);

      expect(result).toEqual([mockPoi]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'poi.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should use default radius of 10km', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getNearbyPois(39.9087, 116.3975);

      // Verify andWhere was called with latitude and longitude ranges
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no POIs nearby', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getNearbyPois(0, 0, 1);

      expect(result).toEqual([]);
    });
  });

  describe('getRandomActivePois', () => {
    it('should return random active POIs', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPoi]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRandomActivePois(50);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual([mockPoi]);
    });
  });

  describe('getPoisForSpawn', () => {
    it('should return POIs ordered by spawn weight', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPoi]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPoisForSpawn(100);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual([mockPoi]);
    });

    it('should filter by preferred POI types when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPoi]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getPoisForSpawn(100, ['landmark', 'park'] as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'poi.poiType IN (:...types)',
        { types: ['landmark', 'park'] },
      );
    });
  });

  describe('incrementCollectCount', () => {
    it('should increment the collect count for a POI', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      await service.incrementCollectCount('poi-1');

      expect(poiRepository.increment).toHaveBeenCalledWith(
        { id: 'poi-1' },
        'collectCount',
        1,
      );
    });
  });

  describe('createPoi', () => {
    it('should create a new POI', async () => {
      const poiData = {
        name: 'New POI',
        latitude: 40.0,
        longitude: 117.0,
        poiType: 'park',
      };
      mockRepository.create.mockReturnValue({ ...mockPoi, ...poiData });
      mockRepository.save.mockResolvedValue({ ...mockPoi, ...poiData });

      const result = await service.createPoi(poiData as any);

      expect(poiRepository.create).toHaveBeenCalled();
      expect(poiRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('New POI');
    });

    it('should auto-assign spawn weight based on POI type', async () => {
      const poiData = { name: 'Park', poiType: 'park' };
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve(data));

      await service.createPoi(poiData as any);

      expect(poiRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          spawnWeight: expect.any(Number),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return POI when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockPoi);

      const result = await service.findById('poi-1');

      expect(poiRepository.findOne).toHaveBeenCalledWith({ where: { id: 'poi-1' } });
      expect(result).toEqual(mockPoi);
    });

    it('should return null when POI not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });
});
