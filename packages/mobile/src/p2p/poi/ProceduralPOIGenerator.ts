/**
 * Procedural POI Generator
 * Generates virtual POI points algorithmically for areas with sparse OSM data
 */

import { POI, PoiType } from '../types';

const GLOBAL_SEED = 'treasure_hunt_procedural_v1';

const POI_NAME_PREFIXES: Record<PoiType, string[]> = {
  landmark: ['神秘', '古老', '传说', '隐藏', '遗迹', '古老'],
  tourism: ['探索', '发现', '观光', '文化', '打卡', '秘境'],
  museum: ['文化', '历史', '艺术', '博物', '展览', '珍藏'],
  park: ['宁静', '绿意', '休闲', '城市', '花园', '绿地'],
  temple: ['宁静', '古老', '神圣', '禅意', '古刹', '道观'],
  shopping: ['商业', '购物', '集市', '商圈', '市集', '商城'],
  entertainment: ['娱乐', '欢乐', '休闲', '游乐', '狂欢', '娱乐'],
  nature: ['自然', '生态', '原始', '秘境', '山水', '森林'],
  business: ['商务', '办公', '中心', '写字楼', '商业', '园区'],
  other: ['未知', '神秘', '待探索', '宝藏', '坐标点', '区域'],
};

const POI_NAME_SUFFIXES: Record<PoiType, string[]> = {
  landmark: ['遗迹', '地标', '宝箱点', '秘境', '古迹', '遗址'],
  tourism: ['景点', '打卡点', '宝藏地', '探索点', '观光点', '游览地'],
  museum: ['馆', '展览馆', '文化中心', '艺术馆', '纪念馆', '博物馆'],
  park: ['公园', '花园', '绿地', '广场', '游园', '景区'],
  temple: ['寺', '庙', '观', '庵', '教堂', '礼拜堂'],
  shopping: ['商城', '集市', '商业街', '购物中心', '市场', '商场'],
  entertainment: ['乐园', '娱乐中心', '游乐场', '俱乐部', '会所', '影城'],
  nature: ['景观', '保护区', '生态圈', '秘境', '森林公园', '湿地'],
  business: ['中心', '园区', '大厦', '办公楼', '基地', '园区'],
  other: ['地点', '区域', '坐标点', '宝藏点', '探索区', '秘境'],
};

export class ProceduralPOIGenerator {
  /**
   * Generate procedural POIs in a grid pattern around user location
   */
  generate(
    userLat: number,
    userLng: number,
    radiusKm: number,
    minPOIs: number = 5
  ): POI[] {
    const pois: POI[] = [];
    const gridSize = this.calculateGridSize(radiusKm);

    // Create hexagonal grid
    const gridPoints = this.createHexGrid(userLat, userLng, radiusKm, gridSize);

    // Generate POI at each grid point based on noise
    for (const point of gridPoints) {
      const noise = this.simpleNoise(point.lat, point.lng, GLOBAL_SEED);

      // Adjust threshold based on desired density
      const threshold = this.calculateThreshold(minPOIs, gridPoints.length);

      if (noise > threshold) {
        const poiType = this.selectPOIType(noise, point.lat, point.lng);
        const poi = this.createPOI(point.lat, point.lng, poiType, noise);

        if (this.isValidLocation(poi)) {
          pois.push(poi);
        }
      }
    }

    // Ensure minimum POIs
    if (pois.length < minPOIs && gridPoints.length > minPOIs) {
      const additionalNeeded = minPOIs - pois.length;
      const sortedPoints = gridPoints
        .map(point => ({
          point,
          noise: this.simpleNoise(point.lat, point.lng, GLOBAL_SEED),
        }))
        .sort((a, b) => b.noise - a.noise)
        .slice(0, additionalNeeded);

      for (const { point, noise } of sortedPoints) {
        const poiType = this.selectPOIType(noise, point.lat, point.lng);
        const poi = this.createPOI(point.lat, point.lng, poiType, noise);

        if (this.isValidLocation(poi) && !pois.find(p => this.isSameLocation(p, poi))) {
          pois.push(poi);
        }
      }
    }

    return pois;
  }

  /**
   * Create hexagonal grid of points
   */
  private createHexGrid(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    gridSize: number
  ): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];
    const radiusDeg = radiusKm / 111; // Approximate conversion

    const rows = Math.ceil(radiusDeg / gridSize) * 2 + 1;

    for (let i = 0; i < rows; i++) {
      const rowLat = centerLat + (i - Math.floor(rows / 2)) * gridSize;
      const colsInRow = i % 2 === 0 ? rows : rows - 1;
      const offset = i % 2 === 0 ? 0 : gridSize / 2;

      for (let j = 0; j < colsInRow; j++) {
        const colLng = centerLng + (j - Math.floor(colsInRow / 2)) * gridSize + offset;
        const dist = this.distance(centerLat, centerLng, rowLat, colLng);

        if (dist <= radiusKm) {
          points.push({ lat: rowLat, lng: colLng });
        }
      }
    }

    return points;
  }

  /**
   * Simple noise function using hash
   */
  private simpleNoise(lat: number, lng: number, seed: string): number {
    const input = `${seed}_${lat.toFixed(5)}_${lng.toFixed(5)}`;
    const hash = this.hashString(input);
    return (hash % 1000) / 1000;
  }

  /**
   * Calculate grid size based on radius
   */
  private calculateGridSize(radiusKm: number): number {
    // Smaller radius = smaller grid for better density
    if (radiusKm <= 1) return 0.001; // ~100m
    if (radiusKm <= 2) return 0.002; // ~200m
    if (radiusKm <= 5) return 0.003; // ~300m
    return 0.005; // ~500m
  }

  /**
   * Calculate noise threshold to achieve desired density
   */
  private calculateThreshold(minPOIs: number, totalPoints: number): number {
    const targetRatio = Math.min(minPOIs / totalPoints, 0.5);
    return 0.7 - targetRatio * 0.4; // Range: 0.3 - 0.7
  }

  /**
   * Select POI type based on noise and location
   */
  private selectPOIType(noise: number, lat: number, lng: number): PoiType {
    // Check if near water
    if (this.isNearWater(lat, lng)) {
      return noise > 0.8 ? 'nature' : 'park';
    }

    // Check if in urban area (simplified)
    const isUrban = this.isUrbanArea(lat, lng);

    if (noise > 0.85) {
      return isUrban ? 'landmark' : 'nature';
    } else if (noise > 0.75) {
      return isUrban ? 'entertainment' : 'park';
    } else if (noise > 0.65) {
      return isUrban ? 'museum' : 'nature';
    } else if (noise > 0.55) {
      return isUrban ? 'shopping' : 'park';
    } else {
      return isUrban ? 'business' : 'nature';
    }
  }

  /**
   * Create POI object
   */
  private createPOI(lat: number, lng: number, poiType: PoiType, noise: number): POI {
    const name = this.generatePOIName(poiType, noise);

    return {
      id: `proc_${Math.abs(this.hashString(`${GLOBAL_SEED}_${lat.toFixed(5)}_${lng.toFixed(5)}`))}`,
      name,
      latitude: lat,
      longitude: lng,
      poiType,
      spawnWeight: noise * 3,
      osmType: 'node',
      tags: {
        'procedural': 'true',
        'generated': new Date().toISOString(),
      },
      cachedAt: Date.now(),
    };
  }

  /**
   * Generate POI name
   */
  private generatePOIName(poiType: PoiType, noise: number): string {
    const prefixes = POI_NAME_PREFIXES[poiType] || POI_NAME_PREFIXES.other;
    const suffixes = POI_NAME_SUFFIXES[poiType] || POI_NAME_SUFFIXES.other;

    const prefixIndex = Math.floor(noise * prefixes.length) % prefixes.length;
    const suffixIndex = Math.floor((1 - noise) * suffixes.length) % suffixes.length;

    return `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`;
  }

  /**
   * Check if location is valid (not in ocean, desert, etc.)
   */
  private isValidLocation(poi: POI): boolean {
    // Filter out extreme latitudes (polar regions)
    if (Math.abs(poi.latitude) > 70) {
      return false;
    }

    // Filter out known deserts (simplified)
    if (this.isInDesert(poi.latitude, poi.longitude)) {
      return false;
    }

    // Filter out open ocean (very simplified)
    if (this.isInOpenOcean(poi.latitude, poi.longitude)) {
      return false;
    }

    return true;
  }

  /**
   * Check if near water
   */
  private isNearWater(lat: number, lng: number): boolean {
    // Simplified major water bodies in China
    const waterBodies = [
      { lat: 30.5, lng: 114.3, radius: 50 }, // 武汉东湖
      { lat: 31.2, lng: 121.5, radius: 20 }, // 上海黄浦江
      { lat: 39.9, lng: 116.4, radius: 30 }, // 北京昆明湖
      { lat: 30.2, lng: 120.1, radius: 40 }, // 杭州西湖
    ];

    for (const water of waterBodies) {
      const dist = this.distance(lat, lng, water.lat, water.lng);
      if (dist < water.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if in urban area (simplified using city coordinates)
   */
  private isUrbanArea(lat: number, lng: number): boolean {
    const cities = [
      { lat: 39.9042, lng: 116.4074 }, // Beijing
      { lat: 31.2304, lng: 121.4737 }, // Shanghai
      { lat: 23.1291, lng: 113.2644 }, // Guangzhou
      { lat: 22.5431, lng: 114.0579 }, // Shenzhen
      { lat: 30.5728, lng: 104.0668 }, // Chengdu
      { lat: 30.2741, lng: 120.1551 }, // Hangzhou
      { lat: 30.5928, lng: 114.3055 }, // Wuhan
      { lat: 32.0603, lng: 118.7969 }, // Nanjing
      { lat: 39.1422, lng: 117.1767 }, // Tianjin
    ];

    for (const city of cities) {
      const dist = this.distance(lat, lng, city.lat, city.lng);
      if (dist < 30) { // 30km radius
        return true;
      }
    }

    return false;
  }

  /**
   * Check if in desert (simplified)
   */
  private isInDesert(lat: number, lng: number): boolean {
    const deserts = [
      { lat: 37.0, lng: 105.0, radius: 300 }, // 腾格里沙漠
      { lat: 39.0, lng: 110.0, radius: 200 }, // 库布其沙漠
      { lat: 36.5, lng: 100.0, radius: 250 }, // 柴达木盆地
    ];

    for (const desert of deserts) {
      const dist = this.distance(lat, lng, desert.lat, desert.lng);
      if (dist < desert.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if in open ocean (very simplified)
   */
  private isInOpenOcean(lat: number, lng: number): boolean {
    // Check if far from mainland China
    const chinaCenter = { lat: 35.8617, lng: 104.1954 };
    const dist = this.distance(lat, lng, chinaCenter.lat, chinaCenter.lng);

    // If very far from center and in ocean coordinates range
    if (dist > 2000 && lng > 125 && lng < 145 && lat > 20 && lat < 45) {
      return true;
    }

    return false;
  }

  /**
   * Check if two POIs are at the same location
   */
  private isSameLocation(poi1: POI, poi2: POI): boolean {
    const dist = this.distance(poi1.latitude, poi1.longitude, poi2.latitude, poi2.longitude);
    return dist < 0.05; // Less than 5km apart
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const proceduralPOIGenerator = new ProceduralPOIGenerator();
