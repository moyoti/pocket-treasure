/**
 * Haptic feedback utility using expo-haptics
 * Provides cross-platform haptic feedback for Android and iOS
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light impact haptic - for success actions
 * Used when: collecting items, completing tasks, successful actions
 */
export async function success(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Haptics not available on some devices
    console.log('[Haptics] success feedback not available');
  }
}

/**
 * Medium impact haptic - for warning actions
 * Used when: warnings, important notifications, approaching items
 */
export async function warning(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.log('[Haptics] warning feedback not available');
  }
}

/**
 * Heavy impact haptic - for error actions
 * Used when: errors, failed actions, important alerts
 */
export async function error(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.log('[Haptics] error feedback not available');
  }
}

/**
 * Celebration pattern - for achievements and legendary finds
 * Uses a sequence of impacts to create a celebratory feel
 * Used when: legendary collection, achievements, milestones
 */
export async function celebration(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // Create a celebratory pattern with multiple impacts
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log('[Haptics] celebration feedback not available');
  }
}

/**
 * Light tap - for subtle interactions
 * Used when: button taps, UI interactions
 */
export async function light(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.log('[Haptics] light feedback not available');
  }
}

/**
 * Medium tap - for moderate interactions
 * Used when: selecting items, toggling switches
 */
export async function medium(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log('[Haptics] medium feedback not available');
  }
}

/**
 * Heavy tap - for significant interactions
 * Used when: important button presses, confirmations
 */
export async function heavy(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.log('[Haptics] heavy feedback not available');
  }
}

/**
 * Selection changed - for picker/selection changes
 * Used when: scrolling through options, changing selections
 */
export async function selection(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.log('[Haptics] selection feedback not available');
  }
}

/**
 * Rarity-based haptic feedback
 * Different haptic patterns based on item rarity
 */
export async function rarityFeedback(rarity: 'common' | 'rare' | 'epic' | 'legendary'): Promise<void> {
  switch (rarity) {
    case 'legendary':
      await celebration();
      break;
    case 'epic':
      await heavy();
      await new Promise(resolve => setTimeout(resolve, 100));
      await medium();
      break;
    case 'rare':
      await medium();
      break;
    case 'common':
      await light();
      break;
  }
}