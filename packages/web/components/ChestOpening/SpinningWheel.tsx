'use client';

import { useMemo } from 'react';
import { SpinningItem } from '@/types/chest';
import { RARITY_COLORS } from '@treasure-hunt/shared';
import { WheelItem } from './WheelItem';
import { easeOutStandard, easeOutLegendary } from '@/lib/easing';
import { useLocale } from '@/contexts/LocaleContext';

interface SpinningWheelProps {
  items: SpinningItem[];
  progress: number;
  isLegendary: boolean;
  chestName: string;
}

const ITEM_HEIGHT = 70;
const VISIBLE_ITEMS = 7;

export function SpinningWheel({
  items,
  progress,
  isLegendary,
  chestName,
}: SpinningWheelProps) {
  const { t } = useLocale();
  const offsetY = useMemo(() => {
    if (items.length === 0) return 0;

    const totalItems = items.length;
    const easeFn = isLegendary ? easeOutLegendary : easeOutStandard;
    const easedProgress = easeFn(progress);

    const fullRotations = 3;
    const baseOffset = fullRotations * totalItems * ITEM_HEIGHT;
    const targetIndex = items.findIndex((item) => item.isTarget);
    const targetOffset = targetIndex * ITEM_HEIGHT;

    const currentOffset =
      baseOffset + targetOffset - easedProgress * ITEM_HEIGHT * 3;

    return currentOffset;
  }, [items, progress, isLegendary]);

  const centerOffset = (VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white mb-1">
          🎁 开启 {chestName}
        </h2>
        <p className="text-gray-400 text-sm">
          {isLegendary ? t('chestOpen.revealingLegendary') : t('chestOpen.revealing')}
        </p>
      </div>

      <div
        className="relative w-80 overflow-hidden rounded-xl bg-gradient-to-b from-gray-900 to-gray-950 border-4 border-gray-700"
        style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      >
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-900 to-transparent z-10 pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent z-10 pointer-events-none" />

        <div
          className="absolute left-2 right-2 border-2 border-yellow-400 rounded-lg z-20 pointer-events-none"
          style={{
            top: centerOffset - 2,
            height: ITEM_HEIGHT,
            boxShadow:
              '0 0 20px rgba(234, 179, 8, 0.5), inset 0 0 10px rgba(234, 179, 8, 0.2)',
          }}
        />

        <div
          className="absolute left-0 right-0"
          style={{
            transform: `translateY(${centerOffset - offsetY}px)`,
            transition: 'none',
          }}
        >
          {items.map((item, index) => (
            <WheelItem key={`${item.id}-${index}`} item={item} index={index} />
          ))}
        </div>
      </div>

      <div className="mt-6 w-80">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              isLegendary
                ? 'bg-gradient-to-r from-purple-500 to-yellow-400'
                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-center text-gray-400 text-sm mt-2">
          {Math.round(progress * 100)}%
        </p>
      </div>
    </div>
  );
}
