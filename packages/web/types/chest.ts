import { ItemRarity } from '@treasure-hunt/shared';

// 开箱状态机状态
export type ChestOpeningState = 'IDLE' | 'SPINNING' | 'REVEALING' | 'COMPLETE';

// 转盘物品项
export interface SpinningItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  iconUrl?: string;
  isTarget: boolean;  // 是否是最终中奖物品
}

// 开箱结果
export interface ChestOpenResult {
  success: boolean;
  chestId: string;
  chestType: string;
  rewards: {
    itemId: string;
    itemName: string;
    rarity: ItemRarity;
    quantity: number;
    iconUrl?: string;
  }[];
  coinsSpent: number;
  newCoinBalance: number;
}

// 宝箱选择项
export interface ChestOption {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  owned: number;  // 拥有数量
  dropRates: {
    rarity: ItemRarity;
    weight: number;
  }[];
}

// 转盘配置
export interface SpinConfig {
  duration: number;  // 动画时长(ms)
  totalItems: number;  // 转盘物品数量
  visibleItems: number;  // 可见物品数
  targetIndex: number;  // 目标物品索引
}