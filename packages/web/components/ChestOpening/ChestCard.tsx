'use client';

import { ChestOption } from '@/types/chest';
import { RARITY_COLORS, RARITY_NAMES } from '@treasure-hunt/shared';

interface ChestCardProps {
  chest: ChestOption;
  isSelected: boolean;
  onClick: () => void;
}

function ChestIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    WOODEN: '🪵',
    IRON: '⚙️',
    GOLDEN: '📦',
    LEGENDARY: '💎',
  };
  return <span className="text-5xl">{icons[type] || '📦'}</span>;
}

const BORDER_COLORS: Record<string, string> = {
  WOODEN: 'border-amber-700',
  IRON: 'border-gray-400',
  GOLDEN: 'border-yellow-400',
  LEGENDARY: 'border-purple-500',
};

export function ChestCard({ chest, isSelected, onClick }: ChestCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all duration-200
        bg-gradient-to-b from-gray-800 to-gray-900
        border-2 ${BORDER_COLORS[chest.type] || 'border-gray-600'}
        ${isSelected ? 'scale-105 shadow-xl ring-4 ring-yellow-400/50' : 'hover:scale-102 hover:shadow-lg'}
      `}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
          ✓ 已选择
        </div>
      )}

      {chest.owned > 0 && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          x{chest.owned}
        </div>
      )}

      <div className="flex justify-center mb-3">
        <ChestIcon type={chest.type} />
      </div>

      <h3 className="text-white font-bold text-center mb-1">{chest.name}</h3>

      <p className="text-gray-400 text-xs text-center mb-3">{chest.description}</p>

      <div className="space-y-1">
        <p className="text-gray-500 text-xs">掉落概率:</p>
        <div className="flex flex-wrap gap-1 justify-center">
          {chest.dropRates.map((drop) => (
            <span
              key={drop.rarity}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${RARITY_COLORS[drop.rarity]}20`,
                color: RARITY_COLORS[drop.rarity],
              }}
            >
              {RARITY_NAMES[drop.rarity]} {drop.weight}%
            </span>
          ))}
        </div>
      </div>

      {chest.price > 0 && (
        <div className="mt-3 text-center">
          <span className="text-yellow-400 font-bold">💰 {chest.price}</span>
        </div>
      )}
    </div>
  );
}
