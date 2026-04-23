/**
 * Daily task definitions
 * Tasks reset daily, players earn rewards for completion
 */

import { DailyTaskDefinition, TaskType, ItemRarity } from '../types';

function generateTaskId(taskType: TaskType, target: number, rarity?: ItemRarity): string {
  const key = `${taskType}_${rarity || ''}_${target}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'task_' + Math.abs(hash).toString(16).padStart(6, '0');
}

export const DAILY_TASK_DEFINITIONS: DailyTaskDefinition[] = [
  // LOGIN TASKS
  {
    id: generateTaskId('login', 1),
    taskType: 'login',
    targetProgress: 1,
    rewards: {
      coins: 50,
      experience: 100,
    },
    name: 'Daily Login',
    nameZh: '每日登录',
    description: 'Log in to the game today.',
  },

  // COLLECT TASKS
  {
    id: generateTaskId('collect', 1),
    taskType: 'collect',
    targetProgress: 1,
    rewards: {
      coins: 30,
      experience: 50,
    },
    name: 'Collect 1 Item',
    nameZh: '收集1个物品',
    description: 'Collect one treasure item.',
  },
  {
    id: generateTaskId('collect', 3),
    taskType: 'collect',
    targetProgress: 3,
    rewards: {
      coins: 80,
      experience: 150,
      itemId: 'lucky_charm',
      itemQuantity: 1,
    },
    name: 'Collect 3 Items',
    nameZh: '收集3个物品',
    description: 'Collect three treasure items today.',
  },
  {
    id: generateTaskId('collect', 5),
    taskType: 'collect',
    targetProgress: 5,
    rewards: {
      coins: 150,
      experience: 300,
    },
    name: 'Collect 5 Items',
    nameZh: '收集5个物品',
    description: 'Collect five treasure items today.',
  },

  // VISIT POI TASKS
  {
    id: generateTaskId('visit_poi', 1),
    taskType: 'visit_poi',
    targetProgress: 1,
    rewards: {
      coins: 20,
      experience: 30,
    },
    name: 'Visit 1 POI',
    nameZh: '访问1个地点',
    description: 'Visit one point of interest.',
  },
  {
    id: generateTaskId('visit_poi', 3),
    taskType: 'visit_poi',
    targetProgress: 3,
    rewards: {
      coins: 60,
      experience: 100,
    },
    name: 'Visit 3 POIs',
    nameZh: '访问3个地点',
    description: 'Visit three points of interest today.',
  },
  {
    id: generateTaskId('visit_poi', 5),
    taskType: 'visit_poi',
    targetProgress: 5,
    rewards: {
      coins: 100,
      experience: 200,
    },
    name: 'Visit 5 POIs',
    nameZh: '访问5个地点',
    description: 'Visit five points of interest today.',
  },

  // COLLECT RARITY TASKS
  {
    id: generateTaskId('collect_rarity', 1),
    taskType: 'collect_rarity',
    targetProgress: 1,
    rarityRequirement: 'rare',
    rewards: {
      coins: 100,
      experience: 200,
    },
    name: 'Collect Rare Item',
    nameZh: '收集稀有物品',
    description: 'Collect a rare or higher rarity item.',
  },
  {
    id: generateTaskId('collect_rarity', 1, 'epic'),
    taskType: 'collect_rarity',
    targetProgress: 1,
    rarityRequirement: 'epic',
    rewards: {
      coins: 300,
      experience: 500,
    },
    name: 'Collect Epic Item',
    nameZh: '收集史诗物品',
    description: 'Collect an epic or legendary item.',
  },
  {
    id: generateTaskId('collect_rarity', 1, 'legendary'),
    taskType: 'collect_rarity',
    targetProgress: 1,
    rarityRequirement: 'legendary',
    rewards: {
      coins: 1000,
      experience: 1000,
      itemId: 'legendary_chest',
      itemQuantity: 1,
    },
    name: 'Collect Legendary Item',
    nameZh: '收集传说物品',
    description: 'Collect a legendary item - ultimate achievement!',
  },
];

export const DAILY_TASK_VERSION = 1;

export function getDailyTaskById(id: string): DailyTaskDefinition | undefined {
  return DAILY_TASK_DEFINITIONS.find(task => task.id === id);
}

export function getDailyTasksByType(taskType: TaskType): DailyTaskDefinition[] {
  return DAILY_TASK_DEFINITIONS.filter(task => task.taskType === taskType);
}

/**
 * Get tasks available for a given date (all tasks are available daily)
 */
export function getAvailableDailyTasks(): DailyTaskDefinition[] {
  return DAILY_TASK_DEFINITIONS;
}

/**
 * Generate daily task instances for a user
 * Creates UserDailyTask objects from definitions
 */
export function generateDailyTaskInstances(userId: string, date: string): Array<{
  taskDefinitionId: string;
  taskDate: string;
  currentProgress: number;
  status: 'in_progress';
}> {
  return DAILY_TASK_DEFINITIONS.map(def => ({
    taskDefinitionId: def.id,
    taskDate: date,
    currentProgress: 0,
    status: 'in_progress' as const,
  }));
}