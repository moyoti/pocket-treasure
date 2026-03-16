/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventService } from './event.service';
import { GameEvent } from './entities/game-event.entity';

describe('EventService', () => {
  let service: EventService;
  let eventRepository: Repository<GameEvent>;

  const now = new Date();
  const mockActiveEvent: GameEvent = {
    id: 'event-1',
    name: 'Test Event',
    description: 'A test event',
    nameZh: '测试活动',
    isActive: true,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 3600000),
    bonusType: 'rarity',
    bonusValue: 10,
    specialItems: ['item-special-1'],
    restrictedPoiTypes: [],
    bannerUrl: null,
    iconUrl: null,
    createdAt: now,
    updatedAt: now,
  } as unknown as GameEvent;

  const mockQuantityEvent: GameEvent = {
    ...mockActiveEvent,
    id: 'event-2',
    name: 'Quantity Event',
    bonusType: 'quantity',
    bonusValue: 2,
    specialItems: [],
    restrictedPoiTypes: ['park'],
  } as unknown as GameEvent;

  const mockLegendaryEvent: GameEvent = {
    ...mockActiveEvent,
    id: 'event-3',
    name: 'Legendary Event',
    bonusType: 'legendary_rate',
    bonusValue: 50,
    specialItems: ['item-legend-1', 'item-legend-2'],
  } as unknown as GameEvent;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(GameEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventRepository = module.get<Repository<GameEvent>>(getRepositoryToken(GameEvent));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new event', async () => {
      const createDto = {
        name: 'New Event',
        description: 'New event description',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-02T00:00:00Z',
        bonusType: 'rarity',
        bonusValue: 5,
      };
      mockRepository.create.mockReturnValue(mockActiveEvent);
      mockRepository.save.mockResolvedValue(mockActiveEvent);

      const result = await service.create(createDto as any);

      expect(eventRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockActiveEvent);
    });
  });

  describe('findAll', () => {
    it('should return all events sorted by startTime DESC', async () => {
      mockRepository.find.mockResolvedValue([mockActiveEvent]);

      const result = await service.findAll();

      expect(eventRepository.find).toHaveBeenCalledWith({
        order: { startTime: 'DESC' },
      });
      expect(result).toEqual([mockActiveEvent]);
    });
  });

  describe('findOne', () => {
    it('should return event when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockActiveEvent);

      const result = await service.findOne('event-1');

      expect(result).toEqual(mockActiveEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update event fields', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockActiveEvent });
      mockRepository.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.update('event-1', { name: 'Updated Event' } as any);

      expect(result.name).toBe('Updated Event');
    });
  });

  describe('remove', () => {
    it('should remove event', async () => {
      mockRepository.findOne.mockResolvedValue(mockActiveEvent);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('event-1');

      expect(eventRepository.remove).toHaveBeenCalledWith(mockActiveEvent);
    });
  });

  describe('activate / deactivate', () => {
    it('should activate an event', async () => {
      const inactiveEvent = { ...mockActiveEvent, isActive: false };
      mockRepository.findOne.mockResolvedValue(inactiveEvent);
      mockRepository.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.activate('event-1');

      expect(result.isActive).toBe(true);
    });

    it('should deactivate an event', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockActiveEvent });
      mockRepository.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.deactivate('event-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('getActiveEvents', () => {
    it('should return currently active events', async () => {
      mockRepository.find.mockResolvedValue([mockActiveEvent]);

      const result = await service.getActiveEvents();

      expect(result).toEqual([mockActiveEvent]);
    });
  });

  describe('getActiveEventsForPoiType', () => {
    it('should return events applicable to POI type', async () => {
      // mockActiveEvent has empty restrictedPoiTypes (applies to all)
      // mockQuantityEvent restricts to 'park'
      mockRepository.find.mockResolvedValue([mockActiveEvent, mockQuantityEvent]);

      const result = await service.getActiveEventsForPoiType('park');

      expect(result.length).toBe(2);
    });

    it('should exclude events restricted to other POI types', async () => {
      mockRepository.find.mockResolvedValue([mockQuantityEvent]);

      const result = await service.getActiveEventsForPoiType('museum');

      expect(result.length).toBe(0);
    });
  });

  describe('getCombinedRarityBonus', () => {
    it('should sum rarity bonuses from active events', async () => {
      mockRepository.find.mockResolvedValue([mockActiveEvent]);

      const result = await service.getCombinedRarityBonus();

      expect(result).toBe(10);
    });

    it('should return 0 when no rarity events active', async () => {
      mockRepository.find.mockResolvedValue([mockQuantityEvent]);

      const result = await service.getCombinedRarityBonus();

      expect(result).toBe(0);
    });
  });

  describe('getCombinedQuantityMultiplier', () => {
    it('should multiply quantity bonuses from active events', async () => {
      mockRepository.find.mockResolvedValue([mockQuantityEvent]);

      const result = await service.getCombinedQuantityMultiplier();

      expect(result).toBe(2);
    });

    it('should return at least 1', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getCombinedQuantityMultiplier();

      expect(result).toBe(1);
    });
  });

  describe('getLegendaryRateBonus', () => {
    it('should sum legendary rate bonuses', async () => {
      mockRepository.find.mockResolvedValue([mockLegendaryEvent]);

      const result = await service.getLegendaryRateBonus();

      expect(result).toBe(50);
    });
  });

  describe('getActiveSpecialItems', () => {
    it('should return unique special items from all active events', async () => {
      mockRepository.find.mockResolvedValue([mockActiveEvent, mockLegendaryEvent]);

      const result = await service.getActiveSpecialItems();

      expect(result).toContain('item-special-1');
      expect(result).toContain('item-legend-1');
      expect(result).toContain('item-legend-2');
      expect(result.length).toBe(3);
    });

    it('should return empty array when no special items', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getActiveSpecialItems();

      expect(result).toEqual([]);
    });
  });

  describe('cleanupExpiredEvents', () => {
    it('should deactivate expired events', async () => {
      mockRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.cleanupExpiredEvents();

      expect(result).toBe(3);
    });

    it('should return 0 when no events expired', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.cleanupExpiredEvents();

      expect(result).toBe(0);
    });
  });

  describe('activateDueEvents', () => {
    it('should activate events that should be active', async () => {
      mockRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.activateDueEvents();

      expect(result).toBe(2);
    });
  });
});
