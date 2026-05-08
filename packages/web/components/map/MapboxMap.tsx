'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapboxMapProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
}

export function MapboxMap({
  center,
  zoom = 15,
  className = '',
  onMapReady,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center[1], center[0]],
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });
  }, [center, zoom, onMapReady]);

  useEffect(() => {
    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [center[1], center[0]],
        zoom: zoom,
        duration: 500,
      });
    }
  }, [center, zoom]);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} />
  );
}

export function addMarker(
  map: mapboxgl.Map,
  lngLat: [number, number],
  options?: {
    color?: string;
    element?: HTMLElement;
    popup?: string;
  }
): mapboxgl.Marker {
  const marker = new mapboxgl.Marker(options?.element || { color: options?.color || '#3b82f6' })
    .setLngLat(lngLat)
    .addTo(map);

  if (options?.popup) {
    marker.setPopup(new mapboxgl.Popup().setHTML(options.popup));
  }

  return marker;
}

export function addCircle(
  map: mapboxgl.Map,
  lngLat: [number, number],
  radius: number,
  options?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
  }
): void {
  const sourceId = `circle-${Date.now()}`;
  
  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: lngLat,
      },
      properties: {},
    },
  });

  map.addLayer({
    id: `${sourceId}-layer`,
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-radius': radius,
      'circle-color': options?.fillColor || '#3b82f6',
      'circle-opacity': options?.fillOpacity || 0.2,
      'circle-stroke-color': options?.color || '#3b82f6',
      'circle-stroke-width': 2,
    },
  });
}

export type { MapboxMapProps };