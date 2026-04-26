import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyMissionProgress } from '@/src/p2p/types';
import { WEEKLY_MISSION_DEFINITIONS } from '@/src/p2p/data/weeklyMissions';

const STORAGE_KEY = 'weekly_missions_progress';
const WEEK_START_KEY = 'weekly_missions_week_start';

function getWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export async function getWeeklyMissionsProgress(): Promise<WeeklyMissionProgress[]> {
  try {
    const storedWeek = await AsyncStorage.getItem(WEEK_START_KEY);
    const currentWeek = getWeekNumber();
    
    if (storedWeek !== String(currentWeek)) {
      await AsyncStorage.setItem(WEEK_START_KEY, String(currentWeek));
      const newProgress = initializeWeeklyProgress();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    }
    
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    
    return initializeWeeklyProgress();
  } catch (error) {
    console.error('Failed to load weekly missions:', error);
    return initializeWeeklyProgress();
  }
}

export async function saveWeeklyMissionsProgress(progress: WeeklyMissionProgress[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save weekly missions:', error);
  }
}

export async function updateMissionProgress(
  missionId: string, 
  increment: number
): Promise<WeeklyMissionProgress[]> {
  const progress = await getWeeklyMissionsProgress();
  const missionIndex = progress.findIndex(p => p.missionId === missionId);
  
  if (missionIndex >= 0) {
    const mission = progress[missionIndex];
    if (!mission.isCompleted && !mission.rewardsClaimed) {
      mission.currentProgress = Math.min(
        mission.currentProgress + increment,
        mission.targetProgress
      );
      if (mission.currentProgress >= mission.targetProgress) {
        mission.isCompleted = true;
      }
      await saveWeeklyMissionsProgress(progress);
    }
  }
  
  return progress;
}

export async function claimWeeklyMissionReward(missionId: string): Promise<WeeklyMissionProgress[]> {
  const progress = await getWeeklyMissionsProgress();
  const missionIndex = progress.findIndex(p => p.missionId === missionId);
  
  if (missionIndex >= 0) {
    const mission = progress[missionIndex];
    if (mission.isCompleted && !mission.rewardsClaimed) {
      mission.rewardsClaimed = true;
      await saveWeeklyMissionsProgress(progress);
    }
  }
  
  return progress;
}

function initializeWeeklyProgress(): WeeklyMissionProgress[] {
  return WEEKLY_MISSION_DEFINITIONS.map((def: { id: string; targetProgress: number }) => ({
    missionId: def.id,
    currentProgress: 0,
    targetProgress: def.targetProgress,
    isCompleted: false,
    rewardsClaimed: false,
    weekStartedAt: Date.now(),
  }));
}

export function isCurrentWeek(): boolean {
  const currentWeek = getWeekNumber();
  return true;
}