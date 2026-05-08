'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
  onMapReady?: (map: L.Map) => void;
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  
  return null;
}

function MapReadyHandler({ onReady }: { onReady?: (map: L.Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (onReady) {
      onReady(map);
    }
  }, [map, onReady]);
  
  return null;
}

const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074];
const DEFAULT_ZOOM = 15;

export function LeafletMap({
  center,
  zoom = DEFAULT_ZOOM,
  children,
  className = '',
  onMapReady,
}: LeafletMapProps) {
  const initialCenter = useMemo(() => center || DEFAULT_CENTER, []);
  const initialZoom = useMemo(() => zoom, []);
  
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className={className}
      scrollWheelZoom={true}
      attributionControl={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='Tiles &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
        minZoom={3}
      />
      
      {center && <MapCenterUpdater center={center} />}
      {onMapReady && <MapReadyHandler onReady={onMapReady} />}
      
      {children}
    </MapContainer>
  );
}

export type { LeafletMapProps };