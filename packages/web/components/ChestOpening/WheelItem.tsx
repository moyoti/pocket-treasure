'use client';

import { SpinningItem } from '@/types/chest';
import { RARITY_COLORS, RARITY_NAMES } from '@treasure-hunt/shared';

interface WheelItemProps {
  item: SpinningItem;
  index: number;
}

const ITEM_HEIGHT = 70;

const RARITY_ICONS: Record<string, string> = {
  common: '⚪',
  rare: '💎',
  epic: '🔮',
  legendary: '⭐',
};

export function WheelItem({ item, index }: WheelItemProps) {
  const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
  const rarityIcon = RARITY_ICONS[item.rarity] || '⚪';

  return (
    <div
      className={`
        flex items-center gap-3 px-4 border-b border-gray-800
        ${item.isTarget ? 'bg-gradient-to-r from-transparent via-yellow-900/30 to-transparent' : ''}
      `}
      style={{ height: ITEM_HEIGHT }}
    >
      <div 
        className="text-2xl"
        style={{ 
          filter: item.rarity === 'legendary' ? 'drop-shadow(0 0 8px gold)' : 'none',
        }}
      >
        {rarityIcon}
      </div>

      <div className="flex-1 min-w-0">
        <div 
          className="font-bold text-sm truncate"
          style={{ 
            color: rarityColor,
            textShadow: item.rarity === 'legendary' ? `0 0 10px ${rarityColor}` : 'none',
          }}
        >
          {item.name}
        </div>
        <div 
          className="text-xs"
          style={{ color: rarityColor }}
        >
          {RARITY_NAMES[item.rarity]}
        </div>
      </div>

      {item.isTarget && (
        <div className="flex-shrink-0">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ 
              backgroundColor: rarityColor,
              boxShadow: `0 0 10px ${rarityColor}, 0 0 20px ${rarityColor}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
