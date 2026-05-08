import { AreaDefinition, VisitedArea } from '../types';
import { AREAS, getAreasNearby, getAreaById } from '../data/areas';
import { databaseService } from '../database';

export class AreaService {
  private isTracking: boolean = false;
  private onAreaEnter?: (area: AreaDefinition) => void;
  private onAreaExit?: (area: AreaDefinition) => void;
  private onAreaUnlock?: (area: AreaDefinition) => void;
  private watchId?: number;

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
  }

  async startTracking(currentLatitude: number, currentLongitude: number): Promise<void> {
    this.isTracking = true;
  }

  async stopTracking(): Promise<void> {
    this.isTracking = false;
    if (this.watchId !== undefined && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }
  }

  async handleGeofenceEvent(event: { type: 'enter' | 'exit'; areaId: string }): Promise<void> {
    const area = getAreaById(event.areaId);
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
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getActiveGeofenceCount(): number {
    return 0;
  }
}

export const GEOFENCE_TASK_NAME = 'geofence-task';
export const areaService = new AreaService();