import MapboxGL from '@rnmapbox/maps';
import { POI, SpawnedTreasure, UserMarker, ItemRarity, RARITY_COLORS } from '../types';
import { databaseService } from '../database/DatabaseService';

const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const OFFLINE_PACK_NAME_PREFIX = 'treasure-cat-offline-';

interface OfflinePackStatus {
  name: string;
  status: 'downloading' | 'completed' | 'invalid';
  progress: number;
  size: number;
}

export class MapboxService {
  private accessToken: string = '';

  async initialize(accessToken: string): Promise<void> {
    this.accessToken = accessToken;
    MapboxGL.setAccessToken(accessToken);
  }

  async downloadOfflinePack(latitude: number, longitude: number, radiusKm: number = 10): Promise<void> {
    const packName = `${OFFLINE_PACK_NAME_PREFIX}_${latitude}_${longitude}`;

    const bounds = this.calculateBounds(latitude, longitude, radiusKm);

    await MapboxGL.offlineManager.createPack({
      name: packName,
      styleURL: MAPBOX_STYLE_URL,
      minZoom: 10,
      maxZoom: 16,
      bounds: [[bounds.west, bounds.south], [bounds.east, bounds.north]],
    }, (progress, error) => {
      if (error) {
        console.error('Offline pack download error:', error);
      }
    });
  }

  private calculateBounds(lat: number, lon: number, radiusKm: number): { north: number; south: number; east: number; west: number } {
    const latRange = radiusKm / 111.32;
    const lonRange = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

    return {
      north: lat + latRange,
      south: lat - latRange,
      east: lon + lonRange,
      west: lon - lonRange,
    };
  }

  async getOfflinePacks(): Promise<OfflinePackStatus[]> {
    const packs = await MapboxGL.offlineManager.getPacks();

    const packStatuses: OfflinePackStatus[] = [];

    for (const pack of packs || []) {
      packStatuses.push({
        name: pack.name,
        status: 'completed',
        progress: 100,
        size: 0,
      });
    }

    return packStatuses;
  }

  async deleteOfflinePack(packName: string): Promise<void> {
    await MapboxGL.offlineManager.deletePack(packName);
  }

  async hasOfflinePackForRegion(latitude: number, longitude: number): Promise<boolean> {
    const packs = await this.getOfflinePacks();
    const packName = `${OFFLINE_PACK_NAME_PREFIX}_${latitude}_${longitude}`;

    return packs.some(p => p.name.startsWith(packName.split('_').slice(0, 4).join('_')));
  }

  getStyleUrl(): string {
    return MAPBOX_STYLE_URL;
  }

  getMarkerColorByRarity(rarity: ItemRarity): string {
    return RARITY_COLORS[rarity];
  }

  getMarkerImageForPOI(poiType: string): string {
    const iconMap: Record<string, string> = {
      landmark: 'marker-landmark',
      park: 'marker-park',
      museum: 'marker-museum',
      temple: 'marker-temple',
      shopping: 'marker-shopping',
      entertainment: 'marker-entertainment',
      business: 'marker-business',
      tourism: 'marker-tourism',
      nature: 'marker-nature',
      other: 'marker-default',
    };
    return iconMap[poiType] || 'marker-default';
  }

  getMarkerImageForTreasure(rarity: ItemRarity): string {
    const iconMap: Record<ItemRarity, string> = {
      common: 'treasure-common',
      rare: 'treasure-rare',
      epic: 'treasure-epic',
      legendary: 'treasure-legendary',
    };
    return iconMap[rarity];
  }

  getMarkerImageForUserMarker(iconType: string): string {
    const iconMap: Record<string, string> = {
      star: 'marker-star',
      flag: 'marker-flag',
      treasure: 'marker-treasure',
      camp: 'marker-camp',
      note: 'marker-note',
      camera: 'marker-camera',
      heart: 'marker-heart',
      pin: 'marker-pin',
    };
    return iconMap[iconType] || 'marker-default';
  }

  async searchPlaces(query: string, latitude: number, longitude: number): Promise<POI[]> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.accessToken}&proximity=${longitude},${latitude}&limit=10`;

    const response = await fetch(url);
    const data = await response.json();

    const pois: POI[] = [];

    for (const feature of data.features || []) {
      pois.push({
        id: `mapbox_${feature.id}`,
        name: feature.text || feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0],
        poiType: 'other',
        spawnWeight: 1.0,
        osmType: 'node',
        cachedAt: Date.now(),
      });
    }

    return pois;
  }

  async cachePOIData(pois: POI[]): Promise<void> {
    await databaseService.cachePOIs(pois);
  }

  buildTreasureFeatures(spawns: SpawnedTreasure[], poiIdToLocation: Record<string, { lat: number; lon: number }>): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];

    for (const spawn of spawns) {
      const location = poiIdToLocation[spawn.poiId];
      if (!location) continue;

      features.push({
        type: 'Feature',
        id: spawn.poiId,
        geometry: {
          type: 'Point',
          coordinates: [location.lon, location.lat],
        },
        properties: {
          itemId: spawn.itemId,
          rarity: spawn.itemId.split('-')[0] || 'common',
          isCollected: spawn.isCollected,
          expiresAt: spawn.expiresAt,
        },
      });
    }

    return { type: 'FeatureCollection', features };
  }

  buildPOIFeatures(pois: POI[]): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];

    for (const poi of pois) {
      features.push({
        type: 'Feature',
        id: poi.id,
        geometry: {
          type: 'Point',
          coordinates: [poi.longitude, poi.latitude],
        },
        properties: {
          name: poi.name,
          poiType: poi.poiType,
          spawnWeight: poi.spawnWeight,
        },
      });
    }

    return { type: 'FeatureCollection', features };
  }

  buildMarkerFeatures(markers: UserMarker[]): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];

    for (const marker of markers) {
      features.push({
        type: 'Feature',
        id: marker.id,
        geometry: {
          type: 'Point',
          coordinates: [marker.longitude, marker.latitude],
        },
        properties: {
          name: marker.name,
          iconType: marker.iconType,
          color: marker.color,
          isShared: marker.isShared,
        },
      });
    }

    return { type: 'FeatureCollection', features };
  }
}

export const mapboxService = new MapboxService();