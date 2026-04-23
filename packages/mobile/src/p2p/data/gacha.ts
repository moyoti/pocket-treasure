/**
 * Gacha pool definitions
 * Pity system ensures minimum rarity after certain pulls
 */

import { GachaPoolDefinition, ItemRarity } from '../types';

function generateGachaId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'gacha_' + Math.abs(hash).toString(16).padStart(6, '0');
}

export const GACHA_DEFINITIONS: GachaPoolDefinition[] = [
  {
    id: generateGachaId('标准池'),
    name: 'Standard Pool',
    nameZh: '标准池',
    description: 'Standard gacha pool with all item rarities.',
    singlePrice: 100,
    tenPrice: 900, // 10% discount for 10-pull
    pityMinRarity: 'rare',
    pityThreshold: 20, // Guaranteed rare at 20 pulls
    items: [
      { rarity: 'common', weight: 60 },
      { rarity: 'rare', weight: 30 },
      { rarity: 'epic', weight: 8 },
      { rarity: 'legendary', weight: 2 },
    ],
    isActive: true,
  },
  {
    id: generateGachaId('稀有池'),
    name: 'Rare Pool',
    nameZh: '稀有池',
    description: 'Premium pool with higher rare item chances.',
    singlePrice: 200,
    tenPrice: 1800,
    pityMinRarity: 'epic',
    pityThreshold: 30, // Guaranteed epic at 30 pulls
    items: [
      { rarity: 'common', weight: 40 },
      { rarity: 'rare', weight: 40 },
      { rarity: 'epic', weight: 15 },
      { rarity: 'legendary', weight: 5 },
    ],
    isActive: true,
  },
  {
    id: generateGachaId('传说池'),
    name: 'Legendary Pool',
    nameZh: '传说池',
    description: 'Exclusive pool with legendary items.',
    singlePrice: 500,
    tenPrice: 4500,
    pityMinRarity: 'epic',
    pityThreshold: 50, // Guaranteed epic at 50 pulls
    items: [
      { rarity: 'rare', weight: 50 },
      { rarity: 'epic', weight: 35 },
      { rarity: 'legendary', weight: 15 },
    ],
    isActive: true,
  },
  {
    id: generateGachaId('限定池'),
    name: 'Limited Pool',
    nameZh: '限定池',
    description: 'Seasonal limited pool with exclusive items.',
    singlePrice: 300,
    tenPrice: 2700,
    pityMinRarity: 'epic',
    pityThreshold: 40,
    items: [
      { rarity: 'rare', weight: 45 },
      { rarity: 'epic', weight: 40 },
      { rarity: 'legendary', weight: 15 },
    ],
    isActive: false, // Seasonal, disabled by default
  },
];

export const GACHA_VERSION = 1;

export function getGachaPoolById(id: string): GachaPoolDefinition | undefined {
  return GACHA_DEFINITIONS.find(pool => pool.id === id);
}

export function getActiveGachaPools(): GachaPoolDefinition[] {
  return GACHA_DEFINITIONS.filter(pool => pool.isActive);
}

/**
 * Calculate weighted random rarity from pool
 */
export function rollRarity(pool: GachaPoolDefinition): ItemRarity {
  const totalWeight = pool.items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of pool.items) {
    random -= item.weight;
    if (random <= 0) {
      return item.rarity;
    }
  }
  
  // Fallback to lowest rarity
  return 'common';
}