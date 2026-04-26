/**
 * Sound effects module using expo-av
 * Manages collection sounds based on rarity
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { ItemRarity } from '@/types';

type SoundAsset = {
  uri: string;
};

const SOUND_ENABLED_KEY = 'sound_effects_enabled';

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

const soundCache = new Map<string, Audio.Sound>();

async function playSound(asset: SoundAsset): Promise<void> {
  if (!soundEnabled || Platform.OS === 'web') return;

  try {
    const { sound } = await Audio.Sound.createAsync(asset);
    soundCache.set(asset.uri, sound);
    
    await sound.playAsync();
    
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        soundCache.delete(asset.uri);
      }
    });
  } catch (error) {
    console.log('[Sounds] Failed to play sound:', error);
  }
}

const COLLECT_SOUNDS: Record<ItemRarity, SoundAsset> = {
  common: { uri: 'https://assets.treasurehunt.app/sounds/collect-common.mp3' },
  rare: { uri: 'https://assets.treasurehunt.app/sounds/collect-rare.mp3' },
  epic: { uri: 'https://assets.treasurehunt.app/sounds/collect-epic.mp3' },
  legendary: { uri: 'https://assets.treasurehunt.app/sounds/collect-legendary.mp3' },
};

const GACHA_SOUND: SoundAsset = { 
  uri: 'https://assets.treasurehunt.app/sounds/gacha-pull.mp3' 
};

const CHEST_OPEN_SOUND: SoundAsset = { 
  uri: 'https://assets.treasurehunt.app/sounds/chest-open.mp3' 
};

const ACHIEVEMENT_SOUND: SoundAsset = { 
  uri: 'https://assets.treasurehunt.app/sounds/achievement.mp3' 
};

export async function playCollectSound(rarity: ItemRarity): Promise<void> {
  const sound = COLLECT_SOUNDS[rarity];
  if (sound) {
    await playSound(sound);
  }
}

export async function playGachaSound(): Promise<void> {
  await playSound(GACHA_SOUND);
}

export async function playChestOpenSound(): Promise<void> {
  await playSound(CHEST_OPEN_SOUND);
}

export async function playAchievementSound(): Promise<void> {
  await playSound(ACHIEVEMENT_SOUND);
}

export async function unloadAllSounds(): Promise<void> {
  for (const sound of soundCache.values()) {
    await sound.unloadAsync();
  }
  soundCache.clear();
}

export async function preloadSounds(): Promise<void> {
  const allSounds = [
    ...Object.values(COLLECT_SOUNDS),
    GACHA_SOUND,
    CHEST_OPEN_SOUND,
    ACHIEVEMENT_SOUND,
  ];

  try {
    await Promise.all(
      allSounds.map(async (asset) => {
        const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: false });
        soundCache.set(asset.uri, sound);
      })
    );
  } catch (error) {
    console.log('[Sounds] Failed to preload sounds:', error);
  }
}