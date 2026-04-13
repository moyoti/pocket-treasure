'use client';

import { SpawnedItem, ItemRarity } from '@/types';
import { TreasureIcon, RARITY_COLORS } from './Icon';
import { MapPin, Sparkles } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

const RARITY_GLOW_CLASS: Record<ItemRarity, string> = {
  common: 'rarity-glow-common',
  rare: 'rarity-glow-rare',
  epic: 'rarity-glow-epic',
  legendary: 'rarity-glow-legendary',
};

interface ItemModalProps {
  item: SpawnedItem;
  onClose: () => void;
  onCollect: () => void;
}

export default function ItemModal({ item, onClose, onCollect }: ItemModalProps) {
  const { t } = useLocale();
  const rarity = item.itemRarity as ItemRarity;
  const isHighRarity = rarity === 'epic' || rarity === 'legendary';
  const rarityNames: Record<ItemRarity, string> = {
    common: t('inventory.rarity.common'),
    rare: t('inventory.rarity.rare'),
    epic: t('inventory.rarity.epic'),
    legendary: t('inventory.rarity.legendary'),
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="cartoon-card max-w-md w-full p-6 animate-bounce-in">
        <div className="text-center">
          {isHighRarity && (
            <div className="flex items-center justify-center gap-1 mb-2">
              <Sparkles size={16} style={{ color: RARITY_COLORS[rarity] }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: RARITY_COLORS[rarity] }}>
                {rarityNames[rarity]}{t('inventory.discovered')}
              </span>
              <Sparkles size={16} style={{ color: RARITY_COLORS[rarity] }} />
            </div>
          )}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800 ${RARITY_GLOW_CLASS[rarity]}`}
            style={{ backgroundColor: RARITY_COLORS[rarity] + '20' }}
          >
            <TreasureIcon size={48} rarity={rarity} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">{item.itemName}</h2>
          <p
            className="font-bold flex items-center justify-center gap-1"
            style={{ color: RARITY_COLORS[rarity] }}
          >
            {rarityNames[rarity]}
          </p>
          {item.poiName && (
            <p className="text-gray-500 mt-2 flex items-center justify-center gap-1 text-sm">
              <MapPin size="14" /> {item.poiName}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCollect}
            className="cartoon-btn flex-1 collect-button"
          >
            {t('map.collect')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100 transition"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}