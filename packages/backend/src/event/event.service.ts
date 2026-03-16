import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { GameEvent } from './entities/game-event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(GameEvent)
    private eventRepository: Repository<GameEvent>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<GameEvent> {
    const event = this.eventRepository.create({
      ...createEventDto,
      startTime: new Date(createEventDto.startTime),
      endTime: new Date(createEventDto.endTime),
    });
    return this.eventRepository.save(event);
  }

  async findAll(): Promise<GameEvent[]> {
    return this.eventRepository.find({
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GameEvent> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<GameEvent> {
    const event = await this.findOne(id);

    // Copy fields from DTO
    if (updateEventDto.name !== undefined) event.name = updateEventDto.name;
    if (updateEventDto.description !== undefined) event.description = updateEventDto.description;
    if (updateEventDto.nameZh !== undefined) event.nameZh = updateEventDto.nameZh;
    if (updateEventDto.startTime !== undefined) event.startTime = new Date(updateEventDto.startTime);
    if (updateEventDto.endTime !== undefined) event.endTime = new Date(updateEventDto.endTime);
    if (updateEventDto.isActive !== undefined) event.isActive = updateEventDto.isActive;
    if (updateEventDto.bonusType !== undefined) event.bonusType = updateEventDto.bonusType;
    if (updateEventDto.bonusValue !== undefined) event.bonusValue = updateEventDto.bonusValue;
    if (updateEventDto.specialItems !== undefined) event.specialItems = updateEventDto.specialItems;
    if (updateEventDto.restrictedPoiTypes !== undefined) event.restrictedPoiTypes = updateEventDto.restrictedPoiTypes;
    if (updateEventDto.bannerUrl !== undefined) event.bannerUrl = updateEventDto.bannerUrl;
    if (updateEventDto.iconUrl !== undefined) event.iconUrl = updateEventDto.iconUrl;

    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async activate(id: string): Promise<GameEvent> {
    const event = await this.findOne(id);
    event.isActive = true;
    return this.eventRepository.save(event);
  }

  async deactivate(id: string): Promise<GameEvent> {
    const event = await this.findOne(id);
    event.isActive = false;
    return this.eventRepository.save(event);
  }

  /**
   * Get all currently active events
   */
  async getActiveEvents(): Promise<GameEvent[]> {
    const now = new Date();
    return this.eventRepository.find({
      where: {
        isActive: true,
        startTime: LessThan(now),
        endTime: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active events for a specific POI type
   */
  async getActiveEventsForPoiType(poiType: string): Promise<GameEvent[]> {
    const activeEvents = await this.getActiveEvents();

    return activeEvents.filter(event => {
      // If no restriction, applies to all POI types
      if (!event.restrictedPoiTypes || event.restrictedPoiTypes.length === 0) {
        return true;
      }
      return event.restrictedPoiTypes.includes(poiType);
    });
  }

  /**
   * Calculate combined bonus for rarity at a given time
   */
  async getCombinedRarityBonus(poiType?: string): Promise<number> {
    const events = poiType
      ? await this.getActiveEventsForPoiType(poiType)
      : await this.getActiveEvents();

    return events
      .filter(e => e.bonusType === 'rarity')
      .reduce((sum, e) => sum + Number(e.bonusValue), 0);
  }

  /**
   * Calculate combined quantity multiplier
   */
  async getCombinedQuantityMultiplier(poiType?: string): Promise<number> {
    const events = poiType
      ? await this.getActiveEventsForPoiType(poiType)
      : await this.getActiveEvents();

    const multiplier = events
      .filter(e => e.bonusType === 'quantity')
      .reduce((mult, e) => mult * Number(e.bonusValue), 1);

    return Math.max(multiplier, 1);
  }

  /**
   * Calculate legendary rate bonus
   */
  async getLegendaryRateBonus(poiType?: string): Promise<number> {
    const events = poiType
      ? await this.getActiveEventsForPoiType(poiType)
      : await this.getActiveEvents();

    return events
      .filter(e => e.bonusType === 'legendary_rate')
      .reduce((sum, e) => sum + Number(e.bonusValue), 0);
  }

  /**
   * Get all special items from active events
   */
  async getActiveSpecialItems(): Promise<string[]> {
    const events = await this.getActiveEvents();
    const specialItems = new Set<string>();

    for (const event of events) {
      if (event.specialItems) {
        event.specialItems.forEach(itemId => specialItems.add(itemId));
      }
    }

    return Array.from(specialItems);
  }

  /**
   * Cleanup expired events (set isActive to false)
   */
  async cleanupExpiredEvents(): Promise<number> {
    const now = new Date();
    const result = await this.eventRepository.update(
      { endTime: LessThan(now), isActive: true },
      { isActive: false }
    );
    return result.affected || 0;
  }

  /**
   * Automatically activate events that should be active
   */
  async activateDueEvents(): Promise<number> {
    const now = new Date();
    const result = await this.eventRepository.update(
      {
        startTime: LessThan(now),
        endTime: MoreThan(now),
        isActive: false,
      },
      { isActive: true }
    );
    return result.affected || 0;
  }
}