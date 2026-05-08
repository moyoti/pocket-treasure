'use client';

import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { POI } from '@/lib/p2p/types';

interface POIMarkerProps {
  poi: POI;
  onClick?: (poi: POI) => void;
}

const poiTypeColors: Record<string, string> = {
  landmark: '#E74C3C',
  park: '#27AE60',
  museum: '#8E44AD',
  temple: '#F39C12',
  shopping: '#3498DB',
  entertainment: '#E91E63',
  business: '#7F8C8D',
  tourism: '#16A085',
  nature: '#2ECC71',
  other: '#95A5A6',
};

const poiTypeIcons: Record<string, string> = {
  landmark: '🏛️',
  park: '🌳',
  museum: '🎨',
  temple: '🛕',
  shopping: '🛒',
  entertainment: '🎭',
  business: '🏢',
  tourism: '🗺️',
  nature: '🌿',
  other: '📍',
};

function createPOIIcon(poiType: string): L.DivIcon {
  const color = poiTypeColors[poiType] || poiTypeColors.other;
  const emoji = poiTypeIcons[poiType] || poiTypeIcons.other;
  
  return L.divIcon({
    className: 'poi-marker',
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color};
        border-radius: 6px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        font-size: 14px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function POIMarker({ poi, onClick }: POIMarkerProps) {
  const icon = useMemo(() => createPOIIcon(poi.poiType), [poi.poiType]);
  
  const handleClick = () => {
    if (onClick) {
      onClick(poi);
    }
  };
  
  return (
    <Marker
      position={[poi.latitude, poi.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    />
  );
}

export type { POIMarkerProps };