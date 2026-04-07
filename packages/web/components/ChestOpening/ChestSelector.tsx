'use client';

import { ChestOption } from '@/types/chest';
import { ChestCard } from './ChestCard';

interface ChestSelectorProps {
  chests: ChestOption[];
  selectedChest: ChestOption | null;
  onSelectChest: (chest: ChestOption) => void;
  onOpenChest: (chest: ChestOption) => void;
}

export function ChestSelector({
  chests,
  selectedChest,
  onSelectChest,
  onOpenChest,
}: ChestSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">选择宝箱</h2>
        <p className="text-gray-400 text-sm">点击宝箱开始开箱</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {chests.map((chest) => (
          <ChestCard
            key={chest.id}
            chest={chest}
            isSelected={selectedChest?.id === chest.id}
            onClick={() => onSelectChest(chest)}
          />
        ))}
      </div>

      {selectedChest && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => onOpenChest(selectedChest)}
            disabled={selectedChest.owned <= 0 && selectedChest.price > 0}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg transition-all transform
              ${
                selectedChest.owned > 0
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 shadow-lg shadow-yellow-500/30'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {selectedChest.owned > 0
              ? `开启 ${selectedChest.name} (${selectedChest.owned})`
              : `购买 ${selectedChest.name} (💰 ${selectedChest.price})`}
          </button>
        </div>
      )}
    </div>
  );
}
