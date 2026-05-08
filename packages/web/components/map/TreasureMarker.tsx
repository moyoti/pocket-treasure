'use client';

import { useMemo } from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { SpawnedTreasure, POI, RARITY_COLORS, COLLECTION_RADIUS_METERS } from '@/lib/p2p/types';
import { getItemById } from '@/lib/p2p/data';

interface TreasureMarkerProps {
  spawn: SpawnedTreasure;
  poi: POI;
  onClick?: (spawn: SpawnedTreasure) => void;
}

const rarityIcons: Record<string, string> = {
  common: '●',
  rare: '◆',
  epic: '★',
  legendary: '✦',
};

function createTreasureIcon(color: string, rarity: string): L.DivIcon {
  const icon = rarityIcons[rarity] || '●';
  
  return L.divIcon({
    className: 'treasure-marker',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 18px;
        color: white;
        font-weight: bold;
      ">
        ${icon}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function TreasureMarker({ spawn, poi, onClick }: TreasureMarkerProps) {
  const item = getItemById(spawn.itemId);
  const rarity = item?.rarity || 'common';
  const color = RARITY_COLORS[rarity];
  
  const icon = useMemo(() => createTreasureIcon(color, rarity), [color, rarity]);
  
  const handleClick = () => {
    if (onClick) {
      onClick(spawn);
    }
  };
  
  return (
    <>
      <Circle
        center={[poi.latitude, poi.longitude]}
        radius={COLLECTION_RADIUS_METERS}
        pathOptions={{
          color: `${color}80`,
          fillColor: `${color}26`,
          fillOpacity: 0.15,
          weight: 2,
        }}
      />
      <Marker
        position={[poi.latitude, poi.longitude]}
        icon={icon}
        eventHandlers={{
          click: handleClick,
        }}
      />
    </>
  );
}

export type { TreasureMarkerProps };