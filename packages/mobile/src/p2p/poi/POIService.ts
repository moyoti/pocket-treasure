/**
 * POI Service - OpenStreetMap data fetcher
 * Uses Overpass API with fallback instances for reliability
 */

import { POI, PoiType, POI_TYPE_WEIGHTS } from '../types';
import { databaseService } from '../database';
import { getStaticPOIsNearby } from '../data';

// Overpass API instances with different rate limits
const OVERPASS_INSTANCES = [
  {
    name: 'main',
    url: 'https://overpass-api.de/api/interpreter',
    hasRateLimit: true,
    priority: 1,
  },
  {
    name: 'rambler',
    url: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    hasRateLimit: false,
    priority: 2,
  },
  {
    name: 'private',
    url: 'https://overpass.private.coffee/api/interpreter',
    hasRateLimit: false,
    priority: 3,
  },
  {
    name: 'kumi',
    url: 'https://overpass.kumi.systems/api/interpreter',
    hasRateLimit: false,
    priority: 4,
  },
];

interface InstanceStatus {
  name: string;
  url: string;
  isAvailable: boolean;
  lastErrorTime: number;
  consecutiveFailures: number;
  cooldownUntil: number;
}

const POI_QUERY_TAGS = `
  (
    node["tourism"~"attraction|museum|artwork|viewpoint|castle|monument"](around:{radius},{lat},{lng});
    node["amenity"~"museum|arts_centre|library|theatre"](around:{radius},{lat},{lng});
    node["leisure"~"park|garden|nature_reserve|playground"](around:{radius},{lat},{lng});
    node["historic"~"monument|castle|building|church|ruins"](around:{radius},{lat},{lng});
    node["building"~"church|temple|mosque|cathedral|shrine"](around:{radius},{lat},{lng});
    way["tourism"~"attraction|museum|park"](around:{radius},{lat},{lng});
    way["leisure"~"park|garden|nature_reserve"](around:{radius},{lat},{lng});
    way["historic"~"monument|castle"](around:{radius},{lat},{lng});
  );
  out center tags;
`;

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

// Rate limit detection patterns
const RATE_LIMIT_ERRORS = [
  'rate_limited',
  'Too Many Requests',
  '429',
  'Dispatcher_Client::request_read_and_idx',
  'timeout',
  'overcrowded',
];

export class POIService {
  private lastFetchTime = 0;
  private fetchCooldown = 120000; // 2 minutes cooldown between API calls

  // Track status of each instance
  private instanceStatuses: InstanceStatus[] = OVERPASS_INSTANCES.map(inst => ({
    name: inst.name,
    url: inst.url,
    isAvailable: true,
    lastErrorTime: 0,
    consecutiveFailures: 0,
    cooldownUntil: 0,
  }));

  private currentInstanceIndex = 0;

  /**
   * Get the best available instance
   */
  private getAvailableInstance(): InstanceStatus | null {
    const now = Date.now();

    // Sort by priority (lower priority = better)
    const sorted = [...this.instanceStatuses].sort((a, b) => {
      const aPriority = OVERPASS_INSTANCES.find(i => i.name === a.name)?.priority || 99;
      const bPriority = OVERPASS_INSTANCES.find(i => i.name === b.name)?.priority || 99;
      return aPriority - bPriority;
    });

    for (const instance of sorted) {
      // Check if instance is in cooldown
      if (instance.cooldownUntil > now) {
        continue;
      }

      // Check if instance has too many consecutive failures
      if (instance.consecutiveFailures >= 3) {
        // Put in cooldown for 5 minutes after 3 failures
        if (instance.cooldownUntil === 0) {
          instance.cooldownUntil = now + 300000;
        }
        continue;
      }

      return instance;
    }

    // All instances are in cooldown, wait and try the one with shortest cooldown
    const shortestCooldown = sorted.reduce((min, inst) => {
      if (inst.cooldownUntil < min.cooldownUntil) {
        return inst;
      }
      return min;
    });

    return shortestCooldown;
  }

  /**
   * Mark an instance as failed
   */
  private markInstanceFailed(instance: InstanceStatus, error: string): void {
    const now = Date.now();
    instance.lastErrorTime = now;
    instance.consecutiveFailures++;

    // Check if it's a rate limit error
    const isRateLimit = RATE_LIMIT_ERRORS.some(pattern =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isRateLimit) {
      // Rate limit: cooldown for 2 minutes
      instance.cooldownUntil = now + 120000;
      console.log(`[POIService] ${instance.name} rate limited, cooldown until ${new Date(instance.cooldownUntil).toISOString()}`);
    } else if (instance.consecutiveFailures >= 3) {
      // 3 failures: cooldown for 5 minutes
      instance.cooldownUntil = now + 300000;
      console.log(`[POIService] ${instance.name} has ${instance.consecutiveFailures} failures, extended cooldown`);
    }
  }

  /**
   * Mark an instance as successful
   */
  private markInstanceSuccess(instance: InstanceStatus): void {
    instance.consecutiveFailures = 0;
    instance.isAvailable = true;
    instance.cooldownUntil = 0;
  }

  /**
   * Fetch POIs with fallback to multiple instances
   */
  async fetchNearbyPOIs(
    latitude: number,
    longitude: number,
    radiusMeters: number = 2000
  ): Promise<POI[]> {
    const now = Date.now();

    // Check cooldown - return cached data if within cooldown period
    if (now - this.lastFetchTime < this.fetchCooldown) {
      console.log('[POIService] Within cooldown period, using cached data');
      return await databaseService.getPOIsNearby(latitude, longitude, radiusMeters / 1000);
    }

    const query = POI_QUERY_TAGS
      .replace('{lat}', latitude.toString())
      .replace('{lng}', longitude.toString())
      .replace('{radius}', radiusMeters.toString());

    // Try each available instance
    const triedInstances: string[] = [];
    const errors: string[] = [];

    while (triedInstances.length < OVERPASS_INSTANCES.length) {
      const instance = this.getAvailableInstance();

      if (!instance) {
        console.log('[POIService] No available instances, using cached data');
        break;
      }

      if (triedInstances.includes(instance.name)) {
        // Already tried this instance, no more options
        break;
      }

      triedInstances.push(instance.name);

      try {
        console.log(`[POIService] Trying instance: ${instance.name}`);

        const response = await fetch(instance.url, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'TreasureHunt/1.0 (React Native App - https://github.com/treasure-hunt)',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const pois = this.parseOverpassResponse(data.elements);

        // Success!
        this.markInstanceSuccess(instance);
        await databaseService.cachePOIs(pois);
        this.lastFetchTime = now;

        console.log(`[POIService] Successfully fetched ${pois.length} POIs from ${instance.name}`);
        return pois;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${instance.name}: ${errorMsg}`);
        this.markInstanceFailed(instance, errorMsg);
        console.error(`[POIService] ${instance.name} failed: ${errorMsg}`);
      }
    }

    console.warn('[POIService] All instances failed, using static POI data');
    console.warn('[POIService] Errors:', errors.join('; '));

    const staticPOIs = getStaticPOIsNearby(latitude, longitude, radiusMeters / 1000);
    if (staticPOIs.length > 0) {
      console.log(`[POIService] Found ${staticPOIs.length} static POIs`);
      await databaseService.cachePOIs(staticPOIs);
      return staticPOIs;
    }

    return await databaseService.getPOIsNearby(latitude, longitude, radiusMeters / 1000);
  }

  /**
   * Check status of all instances (for debugging/monitoring)
   */
  async checkAllInstanceStatus(): Promise<Record<string, InstanceStatus>> {
    const result: Record<string, InstanceStatus> = {};

    for (const instance of this.instanceStatuses) {
      try {
        const response = await fetch(`${instance.url.replace('/interpreter', '/status')}`, {
          method: 'GET',
        });

        if (response.ok) {
          const text = await response.text();
          result[instance.name] = {
            ...instance,
            isAvailable: !text.includes('rate_limited'),
          };
        } else {
          result[instance.name] = {
            ...instance,
            isAvailable: false,
          };
        }
      } catch {
        result[instance.name] = {
          ...instance,
          isAvailable: false,
        };
      }
    }

    return result;
  }

  private parseOverpassResponse(elements: any[]): POI[] {
    const results: POI[] = [];

    for (const el of elements) {
      if (!el.tags || !el.tags.name) continue;

      const lat = el.lat ?? el.center?.lat ?? 0;
      const lng = el.lon ?? el.center?.lon ?? 0;

      if (lat === 0 || lng === 0) continue;

      const poiType = this.determinePoiType(el.tags);
      const spawnWeight = POI_TYPE_WEIGHTS[poiType] || 1.0;

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
    for (const [key, value] of Object.entries(tags)) {
      const combinedKey = value;
      if (OSM_TYPE_MAP[combinedKey]) {
        return OSM_TYPE_MAP[combinedKey];
      }

      if (key === 'tourism' && value === 'attraction') return 'tourism';
      if (key === 'leisure' && value === 'park') return 'park';
      if (key === 'historic') return 'landmark';
      if (key === 'amenity' && value === 'museum') return 'museum';
      if (key === 'building') return 'temple';
    }

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

  /**
   * Reset all instance cooldowns (for testing/debugging)
   */
  resetCooldowns(): void {
    for (const instance of this.instanceStatuses) {
      instance.cooldownUntil = 0;
      instance.consecutiveFailures = 0;
      instance.isAvailable = true;
    }
  }

  /**
   * Get current instance statuses for UI display
   */
  getInstanceStatuses(): InstanceStatus[] {
    return [...this.instanceStatuses];
  }
}

export const poiService = new POIService();