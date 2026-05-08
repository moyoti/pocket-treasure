import { UserMarker, MarkerIconType } from '../types';
import { markerService, MARKER_ICON_TYPES, MARKER_COLORS } from './MarkerService';

interface MarkerValidationResult {
  isValid: boolean;
  error?: string;
}

export class MarkerEngine {
  validateMarkerCreation(
    name: string,
    latitude: number,
    longitude: number,
    iconType: MarkerIconType,
    color: string
  ): MarkerValidationResult {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Marker name is required' };
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Marker name too long (max 50 characters)' };
    }

    if (latitude < -90 || latitude > 90) {
      return { isValid: false, error: 'Invalid latitude' };
    }

    if (longitude < -180 || longitude > 180) {
      return { isValid: false, error: 'Invalid longitude' };
    }

    if (!MARKER_ICON_TYPES.includes(iconType)) {
      return { isValid: false, error: 'Invalid icon type' };
    }

    if (!MARKER_COLORS.includes(color)) {
      return { isValid: false, error: 'Invalid color' };
    }

    return { isValid: true };
  }

  validateMarkerUpdate(updates: Partial<UserMarker>): MarkerValidationResult {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        return { isValid: false, error: 'Marker name cannot be empty' };
      }
      if (updates.name.length > 50) {
        return { isValid: false, error: 'Marker name too long' };
      }
    }

    if (updates.latitude !== undefined) {
      if (updates.latitude < -90 || updates.latitude > 90) {
        return { isValid: false, error: 'Invalid latitude' };
      }
    }

    if (updates.longitude !== undefined) {
      if (updates.longitude < -180 || updates.longitude > 180) {
        return { isValid: false, error: 'Invalid longitude' };
      }
    }

    if (updates.iconType !== undefined) {
      if (!MARKER_ICON_TYPES.includes(updates.iconType)) {
        return { isValid: false, error: 'Invalid icon type' };
      }
    }

    if (updates.color !== undefined) {
      if (!MARKER_COLORS.includes(updates.color)) {
        return { isValid: false, error: 'Invalid color' };
      }
    }

    return { isValid: true };
  }

  async createMarkerWithValidation(
    name: string,
    latitude: number,
    longitude: number,
    iconType: MarkerIconType,
    color: string,
    description?: string
  ): Promise<UserMarker> {
    const validation = this.validateMarkerCreation(name, latitude, longitude, iconType, color);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return await markerService.createMarker(name, latitude, longitude, iconType, color, description);
  }

  async updateMarkerWithValidation(id: string, updates: Partial<UserMarker>): Promise<UserMarker | null> {
    const validation = this.validateMarkerUpdate(updates);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return await markerService.updateMarker(id, updates);
  }

  async getMarkersForMap(latitude: number, longitude: number, radiusKm: number = 10): Promise<UserMarker[]> {
    return await markerService.getMarkersNearby(latitude, longitude, radiusKm);
  }

  async shareMarkerWithNearby(marker: UserMarker): Promise<void> {
    await markerService.shareMarker(marker);
    await markerService.broadcastMarker(marker);
  }

  calculateDistanceToMarker(userLat: number, userLon: number, marker: UserMarker): number {
    const R = 6371;
    const dLat = (marker.latitude - userLat) * Math.PI / 180;
    const dLon = (marker.longitude - userLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(marker.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  sortMarkersByDistance(userLat: number, userLon: number, markers: UserMarker[]): UserMarker[] {
    return markers.sort((a, b) => {
      const distA = this.calculateDistanceToMarker(userLat, userLon, a);
      const distB = this.calculateDistanceToMarker(userLat, userLon, b);
      return distA - distB;
    });
  }

  getMarkerIconName(iconType: MarkerIconType): string {
    const iconNames: Record<MarkerIconType, string> = {
      star: 'Star',
      flag: 'Flag',
      treasure: 'Treasure',
      camp: 'Camp',
      note: 'Note',
      camera: 'Camera',
      heart: 'Heart',
      pin: 'Pin',
    };
    return iconNames[iconType];
  }

  getMarkerIconNameZh(iconType: MarkerIconType): string {
    const iconNamesZh: Record<MarkerIconType, string> = {
      star: '星星',
      flag: '旗帜',
      treasure: '宝藏',
      camp: '营地',
      note: '笔记',
      camera: '相机',
      heart: '爱心',
      pin: '定位',
    };
    return iconNamesZh[iconType];
  }
}

export const markerEngine = new MarkerEngine();