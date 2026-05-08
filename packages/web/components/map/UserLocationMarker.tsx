'use client';

import { useMemo } from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

interface UserLocationMarkerProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #3B82F6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function UserLocationMarker({ latitude, longitude, accuracy }: UserLocationMarkerProps) {
  const icon = useMemo(() => createUserIcon(), []);
  
  return (
    <>
      {accuracy && (
        <Circle
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.15,
            weight: 1,
            opacity: 0.5,
          }}
        />
      )}
      <Marker
        position={[latitude, longitude]}
        icon={icon}
      />
    </>
  );
}

export type { UserLocationMarkerProps };