/**
 * Shop item definitions
 * In-app purchases using coins only
 */

import { ShopItemDefinition } from '../types';

function generateShopId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'shop_' + Math.abs(hash).toString(16).padStart(6, '0');
}

export const SHOP_DEFINITIONS: ShopItemDefinition[] = [
  // COIN PACKS
  {
    id: generateShopId('小金币包'),
    name: 'Small Coin Pack',
    nameZh: '小金币包',
    description: '100 coins to help you get started.',
    category: 'coins',
    price: 0, // Free starter pack
    rewards: { coins: 100 },
    isAvailable: true,
    purchaseLimit: 1,
  },
  {
    id: generateShopId('金币包'),
    name: 'Coin Pack',
    nameZh: '金币包',
    description: '500 coins for your adventures.',
    category: 'coins',
    price: 1000,
    rewards: { coins: 500 },
    isAvailable: true,
    purchaseLimit: 99,
  },
  {
    id: generateShopId('大金币包'),
    name: 'Large Coin Pack',
    nameZh: '大金币包',
    description: '2000 coins for serious collectors.',
    category: 'coins',
    price: 3000,
    rewards: { coins: 2000 },
    isAvailable: true,
    purchaseLimit: 99,
  },

  // CHESTS
  {
    id: generateShopId('普通宝箱'),
    name: 'Common Chest',
    nameZh: '普通宝箱',
    description: 'A basic chest containing common to rare items.',
    category: 'chests',
    price: 500,
    rewards: { chestType: 'common_chest' },
    isAvailable: true,
    purchaseLimit: 99,
  },
  {
    id: generateShopId('稀有宝箱'),
    name: 'Rare Chest',
    nameZh: '稀有宝箱',
    description: 'A premium chest with higher chance of rare items.',
    category: 'chests',
    price: 1500,
    rewards: { chestType: 'rare_chest' },
    isAvailable: true,
    purchaseLimit: 99,
  },
  {
    id: generateShopId('史诗宝箱'),
    name: 'Epic Chest',
    nameZh: '史诗宝箱',
    description: 'A treasure chest containing epic items.',
    category: 'chests',
    price: 5000,
    rewards: { chestType: 'epic_chest' },
    isAvailable: true,
    purchaseLimit: 50,
  },
  {
    id: generateShopId('传说宝箱'),
    name: 'Legendary Chest',
    nameZh: '传说宝箱',
    description: 'The ultimate chest with legendary items.',
    category: 'chests',
    price: 10000,
    rewards: { chestType: 'legendary_chest' },
    isAvailable: true,
    purchaseLimit: 20,
  },

  // EXPERIENCE BOOSTS
  {
    id: generateShopId('经验药水'),
    name: 'Experience Potion',
    nameZh: '经验药水',
    description: 'Instant +500 experience points.',
    category: 'experience',
    price: 300,
    rewards: { experience: 500 },
    isAvailable: true,
    purchaseLimit: 99,
  },
  {
    id: generateShopId('大经验药水'),
    name: 'Large Experience Potion',
    nameZh: '大经验药水',
    description: 'Instant +2000 experience points.',
    category: 'experience',
    price: 800,
    rewards: { experience: 2000 },
    isAvailable: true,
    purchaseLimit: 50,
  },

  // SPECIAL ITEMS
  {
    id: generateShopId('幸运符'),
    name: 'Lucky Charm',
    nameZh: '幸运符',
    description: 'Increases lucky points by 10.',
    category: 'special',
    price: 2000,
    rewards: { itemId: 'lucky_charm', itemQuantity: 1 },
    isAvailable: true,
    purchaseLimit: 10,
  },
];

export const SHOP_VERSION = 1;

export function getShopItemById(id: string): ShopItemDefinition | undefined {
  return SHOP_DEFINITIONS.find(item => item.id === id);
}

export function getShopItemsByCategory(category: string): ShopItemDefinition[] {
  return SHOP_DEFINITIONS.filter(item => item.category === category && item.isAvailable);
}