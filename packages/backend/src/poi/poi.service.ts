import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POI, PoiType } from './entities/poi.entity';
import { POI_TYPE_WEIGHTS } from '@treasure-hunt/shared';

@Injectable()
export class PoiService implements OnModuleInit {
  private readonly logger = new Logger(PoiService.name);

  constructor(
    @InjectRepository(POI)
    private poiRepository: Repository<POI>,
  ) {}

  async onModuleInit() {
    const count = await this.poiRepository.count();
    if (count === 0) {
      await this.seedInitialPois();
    }
  }

  private async seedInitialPois() {
    this.logger.log('Seeding initial POIs...');

    // 北京地区的测试POI
    const pois: Array<{ name: string; latitude: number; longitude: number; poiType: PoiType }> = [
      { name: '天安门广场', latitude: 39.9087, longitude: 116.3975, poiType: 'landmark' },
      { name: '故宫博物院', latitude: 39.9163, longitude: 116.3972, poiType: 'museum' },
      { name: '景山公园', latitude: 39.9250, longitude: 116.3968, poiType: 'park' },
      { name: '北海公园', latitude: 39.9250, longitude: 116.3838, poiType: 'park' },
      { name: '什刹海', latitude: 39.9410, longitude: 116.3870, poiType: 'landmark' },
      { name: '南锣鼓巷', latitude: 39.9370, longitude: 116.4020, poiType: 'shopping' },
      { name: '鼓楼', latitude: 39.9430, longitude: 116.3930, poiType: 'landmark' },
      { name: '雍和宫', latitude: 39.9470, longitude: 116.4170, poiType: 'temple' },
      { name: '地坛公园', latitude: 39.9500, longitude: 116.4140, poiType: 'park' },
      { name: '日坛公园', latitude: 39.9200, longitude: 116.4480, poiType: 'park' },
      { name: '天坛公园', latitude: 39.8820, longitude: 116.4060, poiType: 'park' },
      { name: '前门大街', latitude: 39.8980, longitude: 116.3980, poiType: 'shopping' },
      { name: '王府井大街', latitude: 39.9130, longitude: 116.4100, poiType: 'shopping' },
      { name: '西单商业街', latitude: 39.9100, longitude: 116.3730, poiType: 'shopping' },
      { name: '三里屯', latitude: 39.9320, longitude: 116.4540, poiType: 'entertainment' },
      { name: '国贸商圈', latitude: 39.9080, longitude: 116.4590, poiType: 'business' },
      { name: '朝阳公园', latitude: 39.9440, longitude: 116.4720, poiType: 'park' },
      { name: '奥林匹克公园', latitude: 40.0020, longitude: 116.3940, poiType: 'landmark' },
      { name: '鸟巢', latitude: 39.9920, longitude: 116.3960, poiType: 'landmark' },
      { name: '水立方', latitude: 39.9930, longitude: 116.3870, poiType: 'landmark' },
    ];

    for (const poiData of pois) {
      const spawnWeight = this.getSpawnWeightForType(poiData.poiType);
      const poi = this.poiRepository.create({
        ...poiData,
        description: `${poiData.name}附近的宝藏点`,
        isActive: true,
        spawnWeight,
        collectCount: 0,
      });
      await this.poiRepository.save(poi);
    }

    this.logger.log(`Seeded ${pois.length} POIs`);
  }

  private getSpawnWeightForType(poiType: PoiType): number {
    return POI_TYPE_WEIGHTS[poiType] || 1.0;
  }

  async findAll(): Promise<POI[]> {
    return this.poiRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getNearbyPois(latitude: number, longitude: number, radiusKm: number = 10): Promise<POI[]> {
    const latRange = radiusKm / 111.32;
    const lngRange = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));

    return this.poiRepository
      .createQueryBuilder('poi')
      .where('poi.isActive = :isActive', { isActive: true })
      .andWhere('poi.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latRange,
        maxLat: latitude + latRange,
      })
      .andWhere('poi.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngRange,
        maxLng: longitude + lngRange,
      })
      .getMany();
  }

  async getRandomActivePois(count: number = 50): Promise<POI[]> {
    return this.poiRepository
      .createQueryBuilder('poi')
      .where('poi.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async getPoisForSpawn(count: number, preferredPoiTypes?: PoiType[]): Promise<POI[]> {
    const query = this.poiRepository
      .createQueryBuilder('poi')
      .where('poi.isActive = :isActive', { isActive: true });

    // Weight by spawnWeight and collectCount (heat)
    // Higher spawnWeight and higher collectCount = higher chance
    query.orderBy('(poi.spawnWeight * (1 + poi.collectCount * 0.01))', 'DESC');

    if (preferredPoiTypes && preferredPoiTypes.length > 0) {
      query.andWhere('poi.poiType IN (:...types)', { types: preferredPoiTypes });
    }

    return query.limit(count).getMany();
  }

  async incrementCollectCount(poiId: string): Promise<void> {
    await this.poiRepository.increment({ id: poiId }, 'collectCount', 1);
  }

  async createPoi(data: Partial<POI>): Promise<POI> {
    if (!data.spawnWeight && data.poiType) {
      data.spawnWeight = this.getSpawnWeightForType(data.poiType as PoiType);
    }
    const poi = this.poiRepository.create(data);
    return this.poiRepository.save(poi);
  }

  async findById(id: string): Promise<POI | null> {
    return this.poiRepository.findOne({ where: { id } });
  }
}