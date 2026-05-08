/**
 * Chest definitions
 * Chests contain random items based on drop pools
 */

import { ChestDefinition, ItemRarity } from '../types';

function generateChestId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'chest_' + Math.abs(hash).toString(16).padStart(6, '0');
}

export const CHEST_DEFINITIONS: ChestDefinition[] = [
  {
    id: generateChestId('普通宝箱'),
    name: 'Common Chest',
    nameZh: '普通宝箱',
    description: 'A basic chest containing common items.',
    openCost: 0, // Free to open
    dropPool: {
      minRarity: 'common',
      maxRarity: 'rare',
    },
  },
  {
    id: generateChestId('稀有宝箱'),
    name: 'Rare Chest',
    nameZh: '稀有宝箱',
    description: 'A chest with higher chance for rare items.',
    openCost: 100,
    dropPool: {
      minRarity: 'common',
      maxRarity: 'epic',
    },
  },
  {
    id: generateChestId('史诗宝箱'),
    name: 'Epic Chest',
    nameZh: '史诗宝箱',
    description: 'A treasure chest containing epic items.',
    openCost: 300,
    dropPool: {
      minRarity: 'rare',
      maxRarity: 'epic',
    },
  },
  {
    id: generateChestId('传说宝箱'),
    name: 'Legendary Chest',
    nameZh: '传说宝箱',
    description: 'The ultimate chest with legendary items.',
    openCost: 500,
    dropPool: {
      minRarity: 'epic',
      maxRarity: 'legendary',
    },
  },
  {
    id: generateChestId('神秘宝箱'),
    name: 'Mystery Chest',
    nameZh: '神秘宝箱',
    description: 'A mysterious chest with unknown contents.',
    openCost: 200,
    dropPool: {
      minRarity: 'common',
      maxRarity: 'legendary',
    },
  },
];

export const CHEST_VERSION = 1;

export function getChestById(id: string): ChestDefinition | undefined {
  return CHEST_DEFINITIONS.find(chest => chest.id === id);
}

/**
 * Get rarity weight for chest drop
 */
export function getChestRarityWeights(chest: ChestDefinition): Record<ItemRarity, number> {
  const weights: Record<ItemRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  
  // Base weights based on rarity range
  if (chest.dropPool.maxRarity === 'legendary') {
    weights.legendary = 5;
    weights.epic = 15;
    weights.rare = 30;
    weights.common = chest.dropPool.minRarity === 'common' ? 50 : 0;
  } else if (chest.dropPool.maxRarity === 'epic') {
    weights.epic = 20;
    weights.rare = 40;
    weights.common = chest.dropPool.minRarity === 'common' ? 40 : 0;
  } else if (chest.dropPool.maxRarity === 'rare') {
    weights.rare = 30;
    weights.common = 70;
  } else {
    weights.common = 100;
  }
  
  // Remove weights below min rarity
  if (chest.dropPool.minRarity !== 'common') {
    weights.common = 0;
  }
  if (chest.dropPool.minRarity === 'epic') {
    weights.rare = 0;
  }
  
  return weights;
}

/**
 * Roll random rarity from chest drop pool
 */
export function rollChestRarity(chest: ChestDefinition): ItemRarity {
  const weights = getChestRarityWeights(chest);
  const totalWeight = weights.common + weights.rare + weights.epic + weights.legendary;
  
  if (totalWeight === 0) {
    return chest.dropPool.minRarity;
  }
  
  let random = Math.random() * totalWeight;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0 && weight > 0) {
      return rarity as ItemRarity;
    }
  }
  
  return chest.dropPool.minRarity;
}

/**
 * Get number of items from chest (random between 1-3)
 */
export function getChestItemCount(chest: ChestDefinition): number {
  // Higher rarity chests give more items
  if (chest.dropPool.maxRarity === 'legendary') {
    return Math.floor(Math.random() * 2) + 2; // 2-3 items
  } else if (chest.dropPool.maxRarity === 'epic') {
    return Math.floor(Math.random() * 2) + 1; // 1-2 items
  }
  return 1;
}