import { POI, PoiType } from '../types';
import { databaseService } from '../database';
import { getStaticPOIsNearby } from '../data';
import { getDynamicPOIConfig } from './dynamicConfig';

const OVERPASS_INSTANCES = [
  {
    name: 'kumi',
    url: 'https://overpass.kumi.systems/api/interpreter',
    priority: 1,
  },
  {
    name: 'rambler',
    url: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    priority: 2,
  },
  {
    name: 'private',
    url: 'https://overpass.private.coffee/api/interpreter',
    priority: 3,
  },
  {
    name: 'main',
    url: 'https://overpass-api.de/api/interpreter',
    priority: 4,
  },
];

interface InstanceStatus {
  name: string;
  url: string;
  isAvailable: boolean;
  cooldownUntil: number;
}

const RATE_LIMIT_ERRORS = [
  'rate_limited',
  'Too Many Requests',
  '429',
  'Dispatcher_Client::request_read_and_idx',
  'timeout',
  'overcrowded',
];

const API_TIMEOUT_MS = 5000;
const COOLDOWN_MS = 60000;

export class DynamicPOIService {
  private lastFetchTime = 0;
  private fetchCooldown = 30000;
  private instanceStatuses: InstanceStatus[] = OVERPASS_INSTANCES.map(inst => ({
    name: inst.name,
    url: inst.url,
    isAvailable: true,
    cooldownUntil: 0,
  }));

  async fetchNearbyPOIs(
    latitude: number,
    longitude: number,
    radiusMeters: number = 2000
  ): Promise<POI[]> {
    const now = Date.now();
    const radiusKm = radiusMeters / 1000;

    const cachedPOIs = await databaseService.getPOIsNearby(latitude, longitude, radiusKm);
    if (cachedPOIs.length > 0) {
      return cachedPOIs;
    }

    const staticPOIs = getStaticPOIsNearby(latitude, longitude, radiusKm);
    if (staticPOIs.length > 0) {
      await databaseService.cachePOIs(staticPOIs);
      return staticPOIs;
    }

    if (now - this.lastFetchTime < this.fetchCooldown) {
      return [];
    }

    const config = getDynamicPOIConfig(latitude, longitude, now);
    const query = this.buildOverpassQuery(latitude, longitude, radiusMeters, config.tags);

    const availableInstances = this.instanceStatuses
      .filter(inst => inst.cooldownUntil <= now)
      .sort((a, b) => {
        const aPriority = OVERPASS_INSTANCES.find(i => i.name === a.name)?.priority || 99;
        const bPriority = OVERPASS_INSTANCES.find(i => i.name === b.name)?.priority || 99;
        return aPriority - bPriority;
      });

    for (const instance of availableInstances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        const response = await fetch(instance.url, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'TreasureHunt/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          this.handleInstanceError(instance, errorText);
          continue;
        }

        const data = await response.json();
        const pois = this.parseOverpassResponse(data.elements, config.weights);

        const statusIndex = this.instanceStatuses.findIndex(i => i.name === instance.name);
        if (statusIndex >= 0) {
          this.instanceStatuses[statusIndex].isAvailable = true;
        }
        await databaseService.cachePOIs(pois);
        this.lastFetchTime = now;

        return pois;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.handleInstanceError(instance, errorMsg);
      }
    }

    return [];
  }

  private buildOverpassQuery(
    lat: number,
    lng: number,
    radius: number,
    tags: string[]
  ): string {
    const tagFilters = tags.map(tag => {
      const [key, ...valueParts] = tag.split('=');
      const value = valueParts.join('=');
      
      if (value.includes('|')) {
        return `  node["${key}"~"${value}"](around:{radius},{lat},{lng});`;
      } else {
        return `  node["${key}"="${value}"](around:{radius},{lat},{lng});`;
      }
    }).join('\n');

    const wayFilters = tags
      .filter(tag => {
        const [key] = tag.split('=');
        return ['tourism', 'leisure', 'historic', 'building', 'amenity', 'natural'].includes(key);
      })
      .map(tag => {
        const [key, ...valueParts] = tag.split('=');
        const value = valueParts.join('=');
        
        if (value.includes('|')) {
          return `  way["${key}"~"${value}"](around:{radius},{lat},{lng});`;
        } else {
          return `  way["${key}"="${value}"](around:{radius},{lat},{lng});`;
        }
      }).join('\n');

    return `
      [out:json][timeout:60];
      (
${tagFilters}
${wayFilters}
      );
      out center tags;
    `.replace('{lat}', lat.toString()).replace('{lng}', lng.toString()).replace('{radius}', radius.toString());
  }

  private handleInstanceError(instance: InstanceStatus, error: string): void {
    const isRateLimit = RATE_LIMIT_ERRORS.some(pattern =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isRateLimit) {
      instance.cooldownUntil = Date.now() + COOLDOWN_MS;
    }
  }

  private parseOverpassResponse(elements: any[], weights: Record<PoiType, number>): POI[] {
    const results: POI[] = [];

    for (const el of elements) {
      if (!el.tags || !el.tags.name) continue;

      const lat = el.lat ?? el.center?.lat ?? 0;
      const lng = el.lon ?? el.center?.lon ?? 0;

      if (lat === 0 || lng === 0) continue;

      const poiType = this.determinePoiType(el.tags);
      const spawnWeight = weights[poiType] ?? 1.0;

      results.push({
        id: `${el.type}/${el.id}`,
        name: el.tags.name || 'Unknown Location',
        latitude: lat,
        longitude: lng,
        poiType,
        spawnWeight,
        osmType: el.type as 'node' | 'way' | 'relation',
        tags: el.tags,
        cachedAt: Date.now(),
      });
    }

    return results;
  }

  private determinePoiType(tags: Record<string, string>): PoiType {
    const OSM_TYPE_MAP: Record<string, PoiType> = {
      'attraction': 'tourism',
      'museum': 'museum',
      'artwork': 'tourism',
      'viewpoint': 'tourism',
      'castle': 'landmark',
      'monument': 'landmark',
      'park': 'park',
      'garden': 'park',
      'nature_reserve': 'nature',
      'playground': 'park',
      'church': 'temple',
      'temple': 'temple',
      'mosque': 'temple',
      'cathedral': 'temple',
      'shrine': 'temple',
      'library': 'museum',
      'arts_centre': 'museum',
      'theatre': 'entertainment',
      'ruins': 'landmark',
    };

    for (const [, value] of Object.entries(tags)) {
      if (OSM_TYPE_MAP[value]) {
        return OSM_TYPE_MAP[value];
      }
    }

    if (tags.tourism === 'attraction') return 'tourism';
    if (tags.leisure === 'park') return 'park';
    if (tags.historic) return 'landmark';
    if (tags.amenity === 'museum') return 'museum';
    if (tags.building) return 'temple';

    return 'other';
  }

  async getPOIById(id: string): Promise<POI | null> {
    return await databaseService.getPOIById(id);
  }

  async getPOIsNearbyCached(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<POI[]> {
    return await databaseService.getPOIsNearby(latitude, longitude, radiusKm);
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;
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

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  isWithinRadius(
    userLat: number,
    userLng: number,
    poiLat: number,
    poiLng: number,
    radiusMeters: number
  ): boolean {
    return this.calculateDistance(userLat, userLng, poiLat, poiLng) <= radiusMeters;
  }

  resetCooldowns(): void {
    for (const instance of this.instanceStatuses) {
      instance.cooldownUntil = 0;
      instance.isAvailable = true;
    }
  }

  getInstanceStatuses(): InstanceStatus[] {
    return [...this.instanceStatuses];
  }
}

export const dynamicPoiService = new DynamicPOIService();
