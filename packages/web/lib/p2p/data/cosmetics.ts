/**
 * Cosmetic definitions
 * Visual decorations: avatar frames, badges, map skins, etc.
 */

import { CosmeticDefinition, CosmeticType, ItemRarity } from '../types';

function generateCosmeticId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'cosmetic_' + Math.abs(hash).toString(16).padStart(6, '0');
}

export const COSMETIC_DEFINITIONS: CosmeticDefinition[] = [
  // AVATAR FRAMES
  {
    id: generateCosmeticId('青铜边框'),
    name: 'Bronze Frame',
    nameZh: '青铜边框',
    description: 'A simple bronze frame for your avatar.',
    type: 'avatar_frame',
    rarity: 'common',
    price: 500,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('白银边框'),
    name: 'Silver Frame',
    nameZh: '白银边框',
    description: 'A shiny silver frame for your avatar.',
    type: 'avatar_frame',
    rarity: 'rare',
    price: 1500,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('黄金边框'),
    name: 'Gold Frame',
    nameZh: '黄金边框',
    description: 'A prestigious gold frame for your avatar.',
    type: 'avatar_frame',
    rarity: 'epic',
    price: 5000,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('钻石边框'),
    name: 'Diamond Frame',
    nameZh: '钻石边框',
    description: 'The ultimate diamond frame for elite collectors.',
    type: 'avatar_frame',
    rarity: 'legendary',
    price: 10000,
    isLimited: true,
    isActive: true,
  },
  {
    id: generateCosmeticId('龙纹边框'),
    name: 'Dragon Frame',
    nameZh: '龙纹边框',
    description: 'A dragon-themed frame with mystical aura.',
    type: 'avatar_frame',
    rarity: 'legendary',
    price: 15000,
    isLimited: true,
    isActive: true,
  },

  // BADGES
  {
    id: generateCosmeticId('探索者徽章'),
    name: 'Explorer Badge',
    nameZh: '探索者徽章',
    description: 'Badge for explorers who travel far.',
    type: 'badge',
    rarity: 'common',
    price: 300,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('收藏家徽章'),
    name: 'Collector Badge',
    nameZh: '收藏家徽章',
    description: 'Badge for dedicated collectors.',
    type: 'badge',
    rarity: 'rare',
    price: 1000,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('大师徽章'),
    name: 'Master Badge',
    nameZh: '大师徽章',
    description: 'Badge for true masters of treasure hunting.',
    type: 'badge',
    rarity: 'epic',
    price: 3000,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('传奇徽章'),
    name: 'Legend Badge',
    nameZh: '传奇徽章',
    description: 'Badge for legendary collectors.',
    type: 'badge',
    rarity: 'legendary',
    price: 8000,
    isLimited: true,
    isActive: true,
  },

  // MAP SKINS
  {
    id: generateCosmeticId('森林地图'),
    name: 'Forest Map',
    nameZh: '森林地图',
    description: 'A forest-themed map skin.',
    type: 'map_skin',
    rarity: 'common',
    price: 400,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('海洋地图'),
    name: 'Ocean Map',
    nameZh: '海洋地图',
    description: 'An ocean-themed map skin.',
    type: 'map_skin',
    rarity: 'rare',
    price: 1200,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('星空地图'),
    name: 'Starry Map',
    nameZh: '星空地图',
    description: 'A starry night-themed map skin.',
    type: 'map_skin',
    rarity: 'epic',
    price: 4000,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('龙腾地图'),
    name: 'Dragon Map',
    nameZh: '龙腾地图',
    description: 'A dragon-themed legendary map skin.',
    type: 'map_skin',
    rarity: 'legendary',
    price: 12000,
    isLimited: true,
    isActive: true,
  },

  // STICKERS
  {
    id: generateCosmeticId('幸运贴纸'),
    name: 'Lucky Sticker',
    nameZh: '幸运贴纸',
    description: 'A cute lucky sticker for your profile.',
    type: 'sticker',
    rarity: 'common',
    price: 200,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('宝藏贴纸'),
    name: 'Treasure Sticker',
    nameZh: '宝藏贴纸',
    description: 'A treasure-themed sticker.',
    type: 'sticker',
    rarity: 'rare',
    price: 600,
    isLimited: false,
    isActive: true,
  },

  // TITLES
  {
    id: generateCosmeticId('探索者称号'),
    name: 'Explorer Title',
    nameZh: '探索者称号',
    description: 'Display "Explorer" on your profile.',
    type: 'title',
    rarity: 'common',
    price: 500,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('收藏家称号'),
    name: 'Collector Title',
    nameZh: '收藏家称号',
    description: 'Display "Collector" on your profile.',
    type: 'title',
    rarity: 'rare',
    price: 1500,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('传奇猎人称号'),
    name: 'Legendary Hunter Title',
    nameZh: '传奇猎人称号',
    description: 'Display "Legendary Hunter" on your profile.',
    type: 'title',
    rarity: 'legendary',
    price: 10000,
    isLimited: true,
    isActive: true,
  },

  // PROFILE BACKGROUNDS
  {
    id: generateCosmeticId('星空背景'),
    name: 'Starry Background',
    nameZh: '星空背景',
    description: 'A beautiful starry night background.',
    type: 'profile_background',
    rarity: 'rare',
    price: 2000,
    isLimited: false,
    isActive: true,
  },
  {
    id: generateCosmeticId('宝藏背景'),
    name: 'Treasure Background',
    nameZh: '宝藏背景',
    description: 'A treasure-themed profile background.',
    type: 'profile_background',
    rarity: 'epic',
    price: 6000,
    isLimited: false,
    isActive: true,
  },
];

export const COSMETIC_VERSION = 1;

export function getCosmeticById(id: string): CosmeticDefinition | undefined {
  return COSMETIC_DEFINITIONS.find(cosmetic => cosmetic.id === id);
}

export function getCosmeticsByType(type: CosmeticType): CosmeticDefinition[] {
  return COSMETIC_DEFINITIONS.filter(cosmetic => cosmetic.type === type && cosmetic.isActive);
}

export function getCosmeticsByRarity(rarity: ItemRarity): CosmeticDefinition[] {
  return COSMETIC_DEFINITIONS.filter(cosmetic => cosmetic.rarity === rarity && cosmetic.isActive);
}

export function getActiveCosmetics(): CosmeticDefinition[] {
  return COSMETIC_DEFINITIONS.filter(cosmetic => cosmetic.isActive);
}