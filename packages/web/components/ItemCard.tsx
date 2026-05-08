'use client';

import { motion } from 'framer-motion';
import { Item, ItemRarity, RARITY_COLORS } from '@treasure-hunt/shared';
import { Card } from './ui/Card';
import { RarityBadge } from './ui/RarityBadge';

interface ItemCardProps {
  item: Item;
  quantity?: number;
  collectedAt?: string;
  poiName?: string;
  onClick?: () => void;
  showQuantity?: boolean;
}

const rarityBackgrounds: Record<ItemRarity, string> = {
  common: 'bg-common/5',
  rare: 'bg-rare/5',
  epic: 'bg-epic/5',
  legendary: 'bg-legendary/5',
};

const rarityBorders: Record<ItemRarity, string> = {
  common: 'border-l-common',
  rare: 'border-l-rare',
  epic: 'border-l-epic',
  legendary: 'border-l-legendary',
};

const rarityIcons: Record<ItemRarity, string> = {
  common: '◇',
  rare: '◆',
  epic: '★',
  legendary: '✦',
};

function ItemCard({
  item,
  quantity = 1,
  collectedAt,
  poiName,
  onClick,
  showQuantity = true,
}: ItemCardProps) {
  const color = RARITY_COLORS[item.rarity];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card
        variant="default"
        padding="none"
        hoverable
        onClick={onClick}
        className={`
          cursor-pointer overflow-hidden
          border-l-4 ${rarityBorders[item.rarity]}
        `}
      >
        <div className="flex items-center p-4 gap-4">
          <div
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              ${rarityBackgrounds[item.rarity]}
            `}
          >
            {item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt={item.name}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <span className="text-2xl" style={{ color }}>
                {rarityIcons[item.rarity]}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text truncate">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <RarityBadge rarity={item.rarity} size="sm" showIcon={false} />
              {poiName && (
                <span className="text-xs text-muted flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {poiName}
                </span>
              )}
            </div>
          </div>

          {showQuantity && (
            <div className="bg-background rounded-lg px-3 py-1.5">
              <span className="font-bold text-primary">×{quantity}</span>
            </div>
          )}
        </div>

        {collectedAt && (
          <div className="px-4 pb-3 pt-0">
            <span className="text-xs text-muted">
              Collected {new Date(collectedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ItemCardSkeleton() {
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="flex items-center p-4 gap-4">
        <div className="w-14 h-14 rounded-xl bg-border animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-border rounded animate-pulse w-3/4" />
          <div className="h-3 bg-border rounded animate-pulse w-1/2" />
        </div>
        <div className="w-12 h-8 bg-border rounded-lg animate-pulse" />
      </div>
    </Card>
  );
}

export { ItemCard, ItemCardSkeleton };
export type { ItemCardProps };