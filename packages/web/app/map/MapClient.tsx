'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useP2P } from '@/lib/p2p';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

const DEFAULT_ZOOM = 15;

export default function MapClient() {
  const { nearbySpawns, nearbyPOIs, userLocation, collectTreasure, refreshNearby, isLoading, isInitialized } = useP2P();
  const [selectedTreasure, setSelectedTreasure] = useState<any>(null);
  const [collecting, setCollecting] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const lastRefreshRef = useRef<string>('');
  const isRefreshingRef = useRef(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const spawnWithPOI = useMemo(() => {
    const poiMap = new Map(nearbyPOIs.map(p => [p.id, p]));
    return nearbySpawns
      .map(spawn => ({
        spawn,
        poi: poiMap.get(spawn.poiId)
      }))
      .filter(item => item.poi);
  }, [nearbySpawns, nearbyPOIs]);

  const debouncedRefresh = useCallback((lat: number, lng: number) => {
    const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    if (lastRefreshRef.current === key || isRefreshingRef.current) {
      return;
    }
    
    lastRefreshRef.current = key;
    isRefreshingRef.current = true;
    
    refreshNearby(lat, lng).finally(() => {
      isRefreshingRef.current = false;
    });
  }, [refreshNearby]);

  useEffect(() => {
    if (isInitialized && userLocation) {
      debouncedRefresh(userLocation.latitude, userLocation.longitude);
    }
  }, [isInitialized, userLocation, debouncedRefresh]);

  useEffect(() => {
    if (!mapContainer.current || map.current || !userLocation) return;

    if (!mapboxgl.supported()) {
      console.error('Mapbox GL is not supported');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.longitude, userLocation.latitude],
      zoom: DEFAULT_ZOOM,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
      if (userLocation && map.current) {
        updateUserMarker(userLocation.latitude, userLocation.longitude);
        addUserCircle(userLocation.latitude, userLocation.longitude);
      }
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (map.current && userLocation && mapReady) {
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: DEFAULT_ZOOM,
        duration: 500,
      });
      updateUserMarker(userLocation.latitude, userLocation.longitude);
      addUserCircle(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, mapReady]);

  useEffect(() => {
    if (!map.current || !mapReady) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    spawnWithPOI.forEach(({ spawn, poi }) => {
      if (!poi || !map.current) return;

      const el = document.createElement('div');
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.background = '#F59E0B';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<div style="padding: 8px;"><strong>宝藏</strong><br/><small>${spawn.itemId}</small></div>`))
        .addTo(map.current);

      marker.getElement().addEventListener('click', () => {
        setSelectedTreasure(spawn);
      });

      markersRef.current.push(marker);
    });

    nearbyPOIs.forEach((poi) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.background = '#3b82f6';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<div style="padding: 8px;"><strong>${poi.name}</strong><br/><small>${poi.poiType}</small></div>`))
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [spawnWithPOI, nearbyPOIs, mapReady]);

  const updateUserMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.background = '#3b82f6';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const addUserCircle = (lat: number, lng: number) => {
    if (!map.current) return;

    const sourceId = 'user-circle-source';
    const layerId = 'user-circle-layer';

    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {},
      },
    });

    map.current.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 50,
        'circle-color': '#3b82f6',
        'circle-opacity': 0.15,
        'circle-stroke-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-opacity': 0.5,
      },
    });
  };

  const handleCollect = async () => {
    if (!selectedTreasure) return;
    setCollecting(true);
    try {
      const result = await collectTreasure(selectedTreasure);
      if (result.success) {
        setSelectedTreasure(null);
        if (userLocation) {
          lastRefreshRef.current = '';
          debouncedRefresh(userLocation.latitude, userLocation.longitude);
        }
      }
    } finally {
      setCollecting(false);
    }
  };

  if (!isInitialized) {
    return <Loading fullScreen text="初始化中..." />;
  }

  if (!userLocation) {
    return <Loading fullScreen text="获取位置中..." />;
  }

  if (!mapboxgl.supported()) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-bold mb-2">地图不支持</h2>
            <p className="text-sm text-muted">
              您的浏览器不支持 Mapbox GL。请使用支持 WebGL 的现代浏览器。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (userLocation) {
              lastRefreshRef.current = '';
              debouncedRefresh(userLocation.latitude, userLocation.longitude);
            }
          }}
        >
          🔄 刷新
        </Button>
      </div>

      <div className="absolute bottom-20 left-4 right-4 z-[1000]">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">
                附近宝藏: {nearbySpawns.length}
              </span>
              <span className="text-sm text-muted">
                POI: {nearbyPOIs.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTreasure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2">发现宝藏!</h3>
              <p className="text-sm text-muted mb-4">{selectedTreasure.itemId}</p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleCollect}
                  disabled={collecting}
                >
                  {collecting ? '收集中...' : '收集'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedTreasure(null)}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}