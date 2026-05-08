/**
 * Achievement definitions
 * Long-term goals with tiered progression
 */

import { AchievementDefinition, AchievementType, ItemRarity } from '../types';

function generateAchievementId(type: AchievementType, requirement: number, tier: number): string {
  const key = `${type}_${requirement}_${tier}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'ach_' + Math.abs(hash).toString(16).padStart(6, '0');
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // COLLECTION ACHIEVEMENTS (Tiered)
  {
    id: generateAchievementId('collection', 10, 1),
    name: 'Novice Collector',
    nameZh: '新手收藏家',
    description: 'Collect 10 unique items.',
    icon: 'collection_tier1',
    type: 'collection',
    requirement: 10,
    tier: 1,
    rewards: {
      coins: 200,
      experience: 500,
      title: '新手收藏家',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('collection', 50, 2),
    name: 'Apprentice Collector',
    nameZh: '学徒收藏家',
    description: 'Collect 50 unique items.',
    icon: 'collection_tier2',
    type: 'collection',
    requirement: 50,
    tier: 2,
    rewards: {
      coins: 500,
      experience: 1500,
      title: '学徒收藏家',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('collection', 100, 3),
    name: 'Expert Collector',
    nameZh: '专家收藏家',
    description: 'Collect 100 unique items.',
    icon: 'collection_tier3',
    type: 'collection',
    requirement: 100,
    tier: 3,
    rewards: {
      coins: 1000,
      experience: 3000,
      title: '专家收藏家',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('collection', 200, 4),
    name: 'Master Collector',
    nameZh: '大师收藏家',
    description: 'Collect 200 unique items.',
    icon: 'collection_tier4',
    type: 'collection',
    requirement: 200,
    tier: 4,
    rewards: {
      coins: 2000,
      experience: 5000,
      title: '大师收藏家',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('collection', 500, 5),
    name: 'Legendary Collector',
    nameZh: '传奇收藏家',
    description: 'Collect 500 unique items.',
    icon: 'collection_tier5',
    type: 'collection',
    requirement: 500,
    tier: 5,
    rewards: {
      coins: 5000,
      experience: 10000,
      title: '传奇收藏家',
    },
    isHidden: false,
    isActive: true,
  },

  // RARITY ACHIEVEMENTS
  {
    id: generateAchievementId('rarity', 1, 1),
    name: 'First Rare',
    nameZh: '首件稀有',
    description: 'Collect your first rare item.',
    icon: 'rare_first',
    type: 'rarity',
    requirement: 1,
    tier: 1,
    rarityRequirement: 'rare',
    rewards: {
      coins: 100,
      experience: 200,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('rarity', 10, 2),
    name: 'Rare Hunter',
    nameZh: '稀有猎人',
    description: 'Collect 10 rare items.',
    icon: 'rare_hunter',
    type: 'rarity',
    requirement: 10,
    tier: 2,
    rarityRequirement: 'rare',
    rewards: {
      coins: 500,
      experience: 1000,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('rarity', 1, 1),
    name: 'First Epic',
    nameZh: '首件史诗',
    description: 'Collect your first epic item.',
    icon: 'epic_first',
    type: 'rarity',
    requirement: 1,
    tier: 1,
    rarityRequirement: 'epic',
    rewards: {
      coins: 500,
      experience: 1000,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('rarity', 5, 2),
    name: 'Epic Hunter',
    nameZh: '史诗猎人',
    description: 'Collect 5 epic items.',
    icon: 'epic_hunter',
    type: 'rarity',
    requirement: 5,
    tier: 2,
    rarityRequirement: 'epic',
    rewards: {
      coins: 2000,
      experience: 4000,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('rarity', 1, 1),
    name: 'First Legendary',
    nameZh: '首件传说',
    description: 'Collect your first legendary item.',
    icon: 'legendary_first',
    type: 'rarity',
    requirement: 1,
    tier: 1,
    rarityRequirement: 'legendary',
    rewards: {
      coins: 2000,
      experience: 5000,
      title: '传说发现者',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('rarity', 5, 2),
    name: 'Legendary Hunter',
    nameZh: '传说猎人',
    description: 'Collect 5 legendary items.',
    icon: 'legendary_hunter',
    type: 'rarity',
    requirement: 5,
    tier: 2,
    rarityRequirement: 'legendary',
    rewards: {
      coins: 10000,
      experience: 20000,
      title: '传说猎人',
    },
    isHidden: false,
    isActive: true,
  },

  // STREAK ACHIEVEMENTS
  {
    id: generateAchievementId('streak', 7, 1),
    name: 'Weekly Explorer',
    nameZh: '每周探索者',
    description: 'Log in 7 consecutive days.',
    icon: 'streak_week',
    type: 'streak',
    requirement: 7,
    tier: 1,
    rewards: {
      coins: 300,
      experience: 500,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('streak', 30, 2),
    name: 'Monthly Explorer',
    nameZh: '每月探索者',
    description: 'Log in 30 consecutive days.',
    icon: 'streak_month',
    type: 'streak',
    requirement: 30,
    tier: 2,
    rewards: {
      coins: 1000,
      experience: 2000,
      title: '坚持探索者',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('streak', 100, 3),
    name: 'Devoted Explorer',
    nameZh: '忠实探索者',
    description: 'Log in 100 consecutive days.',
    icon: 'streak_100',
    type: 'streak',
    requirement: 100,
    tier: 3,
    rewards: {
      coins: 5000,
      experience: 10000,
      title: '忠实探索者',
    },
    isHidden: false,
    isActive: true,
  },

  // DISTANCE ACHIEVEMENTS
  {
    id: generateAchievementId('distance', 10, 1),
    name: 'Walker',
    nameZh: '步行者',
    description: 'Walk 10 km exploring.',
    icon: 'distance_tier1',
    type: 'distance',
    requirement: 10,
    tier: 1,
    rewards: {
      coins: 200,
      experience: 300,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('distance', 50, 2),
    name: 'Hiker',
    nameZh: '徒步者',
    description: 'Walk 50 km exploring.',
    icon: 'distance_tier2',
    type: 'distance',
    requirement: 50,
    tier: 2,
    rewards: {
      coins: 500,
      experience: 1000,
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('distance', 100, 3),
    name: 'Traveler',
    nameZh: '旅行者',
    description: 'Walk 100 km exploring.',
    icon: 'distance_tier3',
    type: 'distance',
    requirement: 100,
    tier: 3,
    rewards: {
      coins: 1000,
      experience: 2500,
      title: '旅行者',
    },
    isHidden: false,
    isActive: true,
  },
  {
    id: generateAchievementId('distance', 500, 4),
    name: 'Explorer',
    nameZh: '探险家',
    description: 'Walk 500 km exploring.',
    icon: 'distance_tier4',
    type: 'distance',
    requirement: 500,
    tier: 4,
    rewards: {
      coins: 3000,
      experience: 7000,
      title: '探险家',
    },
    isHidden: false,
    isActive: true,
  },

  // SPECIAL ACHIEVEMENTS (Hidden)
  {
    id: generateAchievementId('special', 1, 1),
    name: 'Night Owl',
    nameZh: '夜猫子',
    description: 'Collect items after midnight.',
    icon: 'special_night',
    type: 'special',
    requirement: 10,
    tier: 1,
    rewards: {
      coins: 500,
      experience: 1000,
    },
    isHidden: true,
    isActive: true,
  },
  {
    id: generateAchievementId('special', 1, 2),
    name: 'Lucky Star',
    nameZh: '幸运之星',
    description: 'Collect 3 legendary items in one day.',
    icon: 'special_lucky',
    type: 'special',
    requirement: 3,
    tier: 2,
    rewards: {
      coins: 5000,
      experience: 10000,
      title: '幸运之星',
    },
    isHidden: true,
    isActive: true,
  },
];

export const ACHIEVEMENT_VERSION = 1;

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(ach => ach.id === id);
}

export function getAchievementsByType(type: AchievementType): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(ach => ach.type === type && ach.isActive);
}

export function getVisibleAchievements(): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(ach => !ach.isHidden && ach.isActive);
}

export function getHiddenAchievements(): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(ach => ach.isHidden && ach.isActive);
}

/**
 * Get the next tier achievement for a given type and current progress
 */
export function getNextTierAchievement(
  type: AchievementType,
  currentProgress: number
): AchievementDefinition | undefined {
  const achievements = ACHIEVEMENT_DEFINITIONS
    .filter(ach => ach.type === type && ach.isActive && !ach.isHidden)
    .sort((a, b) => a.requirement - b.requirement);
  
  return achievements.find(ach => ach.requirement > currentProgress);
}