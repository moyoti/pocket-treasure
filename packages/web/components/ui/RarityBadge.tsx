'use client';

import { motion } from 'framer-motion';
import { ItemRarity, RARITY_COLORS, RARITY_NAMES } from '@treasure-hunt/shared';

type BadgeSize = 'sm' | 'md' | 'lg';

interface RarityBadgeProps {
  rarity: ItemRarity;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
}

const rarityBackgrounds: Record<ItemRarity, string> = {
  common: 'bg-common/10',
  rare: 'bg-rare/10',
  epic: 'bg-epic/10',
  legendary: 'bg-legendary/10',
};

const rarityBorders: Record<ItemRarity, string> = {
  common: 'border-common/30',
  rare: 'border-rare/30',
  epic: 'border-epic/30',
  legendary: 'border-legendary/30',
};

const sizeStyles: Record<BadgeSize, { badge: string; text: string; icon: number }> = {
  sm: { badge: 'px-2 py-0.5', text: 'text-xs', icon: 12 },
  md: { badge: 'px-3 py-1', text: 'text-sm', icon: 14 },
  lg: { badge: 'px-4 py-1.5', text: 'text-base', icon: 16 },
};

const rarityIcons: Record<ItemRarity, string> = {
  common: '●',
  rare: '◆',
  epic: '★',
  legendary: '✦',
};

function RarityBadge({
  rarity,
  size = 'md',
  showIcon = true,
  className = '',
}: RarityBadgeProps) {
  const { badge, text, icon } = sizeStyles[size];
  const color = RARITY_COLORS[rarity];
  const name = RARITY_NAMES[rarity];

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center gap-1.5
        rounded-lg font-bold
        border
        ${rarityBackgrounds[rarity]}
        ${rarityBorders[rarity]}
        ${badge}
        ${className}
      `}
      style={{ borderColor: `${color}30` }}
    >
      {showIcon && (
        <span style={{ fontSize: icon, color }}>{rarityIcons[rarity]}</span>
      )}
      <span className={`${text}`} style={{ color }}>
        {name}
      </span>
    </motion.span>
  );
}

function RarityGlow({ rarity, className = '' }: { rarity: ItemRarity; className?: string }) {
  const color = RARITY_COLORS[rarity];

  return (
    <motion.div
      className={`absolute inset-0 rounded-xl opacity-0 ${className}`}
      animate={{
        opacity: [0, 0.3, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
      }}
    />
  );
}

export { RarityBadge, RarityGlow };
export type { RarityBadgeProps, BadgeSize };