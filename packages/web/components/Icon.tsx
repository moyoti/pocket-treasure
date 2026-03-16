'use client';

import React from 'react';
import {
  Gem,
  MapPin,
  RefreshCw,
  ClipboardList,
  Map,
  Mail,
  Lock,
  Loader2,
  Rocket,
  LogOut,
  Chrome,
  Apple,
  Check,
  AlertTriangle,
  X,
  PartyPopper,
  Trophy,
  Package,
  Star,
  Sparkles,
  Compass,
  Settings,
  HelpCircle,
  User,
  BarChart3,
  type LucideIcon
} from 'lucide-react';

// Icon name to component mapping
const iconMap: Record<string, LucideIcon> = {
  // Treasure & Items
  gem: Gem,
  treasure: Gem,
  package: Package,
  
  // Location & Navigation
  mapPin: MapPin,
  location: MapPin,
  map: Map,
  compass: Compass,
  
  // Actions
  refresh: RefreshCw,
  clipboard: ClipboardList,
  rocket: Rocket,
  logout: LogOut,
  
  // Auth
  mail: Mail,
  lock: Lock,
  
  // Status
  loader: Loader2,
  check: Check,
  warning: AlertTriangle,
  error: X,
  success: Check,
  party: PartyPopper,
  
  // Social
  google: Chrome,
  apple: Apple,
  
  // Profile & Stats
  trophy: Trophy,
  star: Star,
  sparkles: Sparkles,
  settings: Settings,
  help: HelpCircle,
  user: User,
  chart: BarChart3,
};

// Rarity colors
export const RARITY_COLORS = {
  common: '#6B7280',
  rare: '#0EA5E9',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
} as const;

// Rarity background colors (light versions for readability)
export const RARITY_BG_COLORS = {
  common: '#F3F4F6',
  rare: '#DBEAFE',
  epic: '#EDE9FE',
  legendary: '#FEF3C7',
} as const;

// Rarity icons (different styles for different rarities)
export const getRarityIcon = (rarity: keyof typeof RARITY_COLORS) => {
  switch (rarity) {
    case 'legendary':
      return Sparkles;
    case 'epic':
      return Star;
    case 'rare':
      return Gem;
    default:
      return Package;
  }
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 24, color, className = '', strokeWidth = 2 }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}

// Pre-configured icon components for common use cases
export const TreasureIcon = ({ size = 24, rarity = 'common' }: { size?: number; rarity?: keyof typeof RARITY_COLORS }) => {
  const IconComponent = getRarityIcon(rarity);
  return <IconComponent size={size} color={RARITY_COLORS[rarity]} />;
};

export const MapMarkerIcon = ({ color = '#3b82f6', size = 24 }: { color?: string; size?: number }) => (
  <MapPin size={size} color={color} fill={color} fillOpacity={0.2} />
);

export const LoadingSpinner = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);