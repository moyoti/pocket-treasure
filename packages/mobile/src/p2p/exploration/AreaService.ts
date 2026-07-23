import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { AreaDefinition, VisitedArea } from '../types';
import { AREAS, getAreasNearby, getAreaById } from '../data/areas';
import { databaseService } from '../database/DatabaseService';
import { Platform } from 'react-native';

const GEOFENCE_TASK = 'geofence-task';
const MAX_IOS_REGIONS = 20;
const MAX_ANDROID_REGIONS = 100;

interface GeofenceEvent {
  type: 'enter' | 'exit';
  region: Location.LocationRegion;
}

let activeGeofences: Location.LocationRegion[] = [];
let registeredAreaIds: Set<string> = new Set();

export class AreaService {
  private isTracking: boolean = false;
  private onAreaEnter?: (area: AreaDefinition) => void;
  private onAreaExit?: (area: AreaDefinition) => void;
  private onAreaUnlock?: (area: AreaDefinition) => void;

  async initialize(
    onAreaEnter?: (area: AreaDefinition) => void,
    onAreaExit?: (area: AreaDefinition) => void,
    onAreaUnlock?: (area: AreaDefinition) => void
  ): Promise<void> {
    this.onAreaEnter = onAreaEnter;
    this.onAreaExit = onAreaExit;
    this.onAreaUnlock = onAreaUnlock;

    await this.loadVisitedAreas();
  }

  private async loadVisitedAreas(): Promise<void> {
    const visited = await databaseService.getVisitedAreas();
    for (const area of visited) {
      registeredAreaIds.add(area.areaId);
    }
  }

  async startTracking(currentLatitude: number, currentLongitude: number): Promise<void> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission not granted - geofencing limited');
    }

    this.isTracking = true;

    const nearbyAreas = getAreasNearby(currentLatitude, currentLongitude, 50);
    await this.updateGeofences(nearbyAreas, currentLatitude, currentLongitude);
  }

  async stopTracking(): Promise<void> {
    this.isTracking = false;

    for (const region of activeGeofences) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }

    activeGeofences = [];
    registeredAreaIds.clear();
  }

  private async updateGeofences(
    areas: AreaDefinition[],
    currentLatitude: number,
    currentLongitude: number
  ): Promise<void> {
    const maxRegions = Platform.OS === 'ios' ? MAX_IOS_REGIONS : MAX_ANDROID_REGIONS;

    const sortedAreas = areas.sort((a, b) => {
      const distA = this.calculateDistance(currentLatitude, currentLongitude, a.latitude, a.longitude);
      const distB = this.calculateDistance(currentLatitude, currentLongitude, b.latitude, b.longitude);
      return distA - distB;
    });

    const regionsToMonitor = sortedAreas.slice(0, maxRegions);

    for (const region of activeGeofences) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }

    activeGeofences = [];

    for (const area of regionsToMonitor) {
      const areaId = area.id || `area_${Date.now()}_${Math.random()}`;
      const region: Location.LocationRegion = {
        identifier: areaId,
        latitude: area.latitude,
        longitude: area.longitude,
        radius: area.radius,
        notifyOnEnter: true,
        notifyOnExit: true,
      };

      await Location.startGeofencingAsync(GEOFENCE_TASK, [region]);
      activeGeofences.push(region);
      registeredAreaIds.add(areaId);
    }
  }

  async handleGeofenceEvent(event: GeofenceEvent): Promise<void> {
    const areaId = event.region.identifier || '';
    if (!areaId) return;
    
    const area = getAreaById(areaId);

    if (!area) return;

    if (event.type === 'enter') {
      await this.recordAreaVisit(area);

      if (this.onAreaEnter) {
        this.onAreaEnter(area);
      }

      const shouldUnlock = await this.checkUnlockConditions(area);
      if (shouldUnlock) {
        await this.unlockArea(area);
        if (this.onAreaUnlock) {
          this.onAreaUnlock(area);
        }
      }
    } else if (event.type === 'exit') {
      if (this.onAreaExit) {
        this.onAreaExit(area);
      }
    }
  }

  private async recordAreaVisit(area: AreaDefinition): Promise<void> {
    const visited = await databaseService.getVisitedAreas();
    const existing = visited.find(v => v.areaId === area.id);

    const now = Date.now();

    if (existing) {
      await databaseService.updateAreaVisit(area.id);
    } else {
      const newVisit: VisitedArea = {
        id: `visit_${area.id}_${now}`,
        areaId: area.id,
        areaName: area.name,
        areaNameZh: area.nameZh,
        latitude: area.latitude,
        longitude: area.longitude,
        radius: area.radius,
        firstVisitAt: now,
        lastVisitAt: now,
        visitCount: 1,
        isUnlocked: false,
        unlockConditions: JSON.stringify(area.unlockConditions),
      };

      await databaseService.addVisitedArea(newVisit);
    }
  }

  private async checkUnlockConditions(area: AreaDefinition): Promise<boolean> {
    const visited = await databaseService.getVisitedAreas();
    const existing = visited.find(v => v.areaId === area.id);

    if (!existing || existing.isUnlocked) {
      return false;
    }

    const conditions = area.unlockConditions;

    if (!conditions) {
      return true;
    }

    if (conditions.minVisitCount && existing.visitCount < conditions.minVisitCount) {
      return false;
    }

    if (conditions.minLevel) {
      const profile = await databaseService.getUserProfile();
      if (!profile || profile.level < conditions.minLevel) {
        return false;
      }
    }

    if (conditions.requiredItems && conditions.requiredItems.length > 0) {
      const inventory = await databaseService.getInventory();
      const collectedItemIds = inventory.map(i => i.itemId);
      const hasAllItems = conditions.requiredItems.every(itemId => collectedItemIds.includes(itemId));
      if (!hasAllItems) {
        return false;
      }
    }

    return true;
  }

  private async unlockArea(area: AreaDefinition): Promise<void> {
    await databaseService.unlockArea(area.id);

    if (area.rewards) {
      const profile = await databaseService.getUserProfile();
      if (profile) {
        await databaseService.updateUserProfile({
          coins: profile.coins + area.rewards.coins,
          totalCoinsEarned: profile.totalCoinsEarned + area.rewards.coins,
          experience: profile.experience + area.rewards.experience,
        });
      }
    }
  }

  async getVisitedAreas(): Promise<VisitedArea[]> {
    return await databaseService.getVisitedAreas();
  }

  async getUnlockProgress(): Promise<{ total: number; unlocked: number }> {
    const visited = await databaseService.getVisitedAreas();
    return {
      total: AREAS.length,
      unlocked: visited.filter(v => v.isUnlocked).length,
    };
  }

  async refreshGeofences(latitude: number, longitude: number): Promise<void> {
    if (!this.isTracking) return;

    const nearbyAreas = getAreasNearby(latitude, longitude, 50);
    await this.updateGeofences(nearbyAreas, latitude, longitude);
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

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getActiveGeofenceCount(): number {
    return activeGeofences.length;
  }
}

TaskManager.defineTask(GEOFENCE_TASK, async (body: TaskManager.TaskManagerTaskBody<{ eventType: number; region: Location.LocationRegion } | undefined>) => {
  if (body.error) {
    const errorMessage = body.error instanceof Error ? body.error.message : String(body.error);
    console.error('Geofence task error:', errorMessage);
    return;
  }

  if (!body.data) return;

  const eventData = body.data;
  const eventType: 'enter' | 'exit' = eventData.eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit';
  const event: GeofenceEvent = { type: eventType, region: eventData.region };

  await areaService.handleGeofenceEvent(event);
});

export const GEOFENCE_TASK_NAME = GEOFENCE_TASK;
export const areaService = new AreaService();