import { UserMarker, MarkerIconType, SharedMarker } from '../types';
import { databaseService } from '../database';
import { identityService } from '../identity/IdentityService';
import { tradeService } from '../trade/TradeService';
import { encodeMessage, decodeMessage, TradeMessage } from '../trade/TradeProtocol';

export const MARKER_ICON_TYPES: MarkerIconType[] = [
  'star',
  'flag',
  'treasure',
  'camp',
  'note',
  'camera',
  'heart',
  'pin',
];

export const MARKER_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
];

export class MarkerService {
  async createMarker(
    name: string,
    latitude: number,
    longitude: number,
    iconType: MarkerIconType,
    color: string = '#FFD700',
    description?: string
  ): Promise<UserMarker> {
    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const now = Date.now();
    const marker: UserMarker = {
      id: `marker_${identity.publicKey}_${now}`,
      name,
      description,
      latitude,
      longitude,
      iconType,
      color,
      creatorPublicKey: identity.publicKey,
      isShared: false,
      createdAt: now,
      updatedAt: now,
    };

    await databaseService.addUserMarker(marker);

    return marker;
  }

  async updateMarker(id: string, updates: Partial<UserMarker>): Promise<UserMarker | null> {
    await databaseService.updateUserMarker(id, updates);

    const markers = await databaseService.getUserMarkers();
    return markers.find(m => m.id === id) || null;
  }

  async deleteMarker(id: string): Promise<void> {
    await databaseService.deleteUserMarker(id);
  }

  async getAllMarkers(): Promise<UserMarker[]> {
    return await databaseService.getUserMarkers();
  }

  async getMarkersNearby(latitude: number, longitude: number, radiusKm: number): Promise<UserMarker[]> {
    const markers = await this.getAllMarkers();

    return markers.filter(marker => {
      const distance = this.calculateDistance(latitude, longitude, marker.latitude, marker.longitude);
      return distance <= radiusKm;
    });
  }

  async shareMarker(marker: UserMarker): Promise<void> {
    await databaseService.updateUserMarker(marker.id, { isShared: true });
  }

  async broadcastMarker(marker: UserMarker): Promise<void> {
    const message: TradeMessage = {
      type: 'discover',
      sessionId: 'marker-share',
      senderPublicKey: marker.creatorPublicKey,
      senderDisplayName: '',
      timestamp: Date.now(),
      payload: JSON.stringify(marker),
    };

    await tradeService.sendMessage(message);
  }

  async receiveSharedMarker(data: string): Promise<SharedMarker> {
    const markerData = JSON.parse(data) as UserMarker;
    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const sharedMarker: SharedMarker = {
      ...markerData,
      receivedFrom: markerData.creatorPublicKey,
      receivedAt: Date.now(),
    };

    const newMarker: UserMarker = {
      id: `shared_${markerData.id}_${Date.now()}`,
      name: sharedMarker.name,
      description: sharedMarker.description,
      latitude: sharedMarker.latitude,
      longitude: sharedMarker.longitude,
      iconType: sharedMarker.iconType,
      color: sharedMarker.color,
      creatorPublicKey: identity.publicKey,
      isShared: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await databaseService.addUserMarker(newMarker);

    return sharedMarker;
  }

  async copyMarker(markerId: string): Promise<UserMarker> {
    const markers = await this.getAllMarkers();
    const original = markers.find(m => m.id === markerId);

    if (!original) {
      throw new Error('Marker not found');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const now = Date.now();
    const copiedMarker: UserMarker = {
      id: `copy_${original.id}_${now}`,
      name: original.name,
      description: original.description,
      latitude: original.latitude,
      longitude: original.longitude,
      iconType: original.iconType,
      color: original.color,
      creatorPublicKey: identity.publicKey,
      isShared: false,
      createdAt: now,
      updatedAt: now,
    };

    await databaseService.addUserMarker(copiedMarker);

    return copiedMarker;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getAvailableIconTypes(): MarkerIconType[] {
    return MARKER_ICON_TYPES;
  }

  getAvailableColors(): string[] {
    return MARKER_COLORS;
  }
}

export const markerService = new MarkerService();