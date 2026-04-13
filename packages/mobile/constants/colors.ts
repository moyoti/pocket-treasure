import { ItemRarity } from '@/types';
import i18n from '../lib/i18n';

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#8D99AE',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#F59E0B',
};

export const RARITY_BG: Record<ItemRarity, string> = {
  common: '#F1F3F5',
  rare: '#EBF5FF',
  epic: '#F5F0FF',
  legendary: '#FFFBEB',
};

export const RARITY_NAMES: Record<ItemRarity, string> = {
  common: i18n.t('inventory.rarity.common'),
  rare: i18n.t('inventory.rarity.rare'),
  epic: i18n.t('inventory.rarity.epic'),
  legendary: i18n.t('inventory.rarity.legendary'),
};

export const RARITY_ICONS: Record<ItemRarity, string> = {
  common: 'diamond-outline',
  rare: 'diamond',
  epic: 'star',
  legendary: 'trophy',
};
