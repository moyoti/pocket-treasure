'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COLLECTION_RADIUS_METERS, RARITY_COLORS, RARITY_NAMES } from '@treasure-hunt/shared';
import { SpawnedItem, ItemRarity } from '@treasure-hunt/shared';
import { getNearbyItems, collectItem, ApiError } from '@/lib/api';
import api from '@/lib/api';
import type { Item } from '@/types';
import { TreasureIcon } from './Icon';
import { RefreshCw, ClipboardList, MapPin, X, Gem, Map as MapIcon } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

interface MapContentProps {
  location: [number, number];
  onItemsChange?: (items: SpawnedItem[]) => void;
}

interface CollectedItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
}

// Custom Circle component using HTML overlay
function CircleOverlay({
  latitude,
  longitude,
  radius,
  color,
}: {
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
}) {
  const size = radius * 2;
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.15,
        border: `2px solid ${color}`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function MapContent({ location, onItemsChange }: MapContentProps) {
  const { t } = useLocale();
  const [items, setItems] = useState<SpawnedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SpawnedItem | null>(null);
  const [collectedItem, setCollectedItem] = useState<CollectedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemPool, setShowItemPool] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: location[1],
    latitude: location[0],
    zoom: 15,
  });
  const mapRef = useRef<any>(null);

  const RARITY_TREASURE_NAMES: Record<ItemRarity, string> = {
    common: t('map.mysteryChest'),
    rare: t('map.shiningChest'),
    epic: t('map.radiantChest'),
    legendary: t('map.legendaryChest'),
  };

  const fetchAllItems = useCallback(async () => {
    try {
      const response = await api.get('/items');
      setAllItems(response.data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  const fetchItems = useCallback(async (lat: number, lng: number) => {
    try {
      const nearbyItems = await getNearbyItems(lat, lng);
      setItems(nearbyItems);
      setError('');
      onItemsChange?.(nearbyItems);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      if (err instanceof ApiError) {
        setError(err.message || t('map.loadFailed'));
      } else {
        setError(t('map.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [onItemsChange]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchItems(location[0], location[1]);
      setViewState({
        longitude: location[1],
        latitude: location[0],
        zoom: 15,
      });
    }
  }, [location, fetchItems, isClient]);

  const handleCollect = async () => {
    if (!selectedItem || !location) return;
    try {
      const result = await collectItem(selectedItem.id, location[0], location[1]);
      if (result.success) {
        setCollectedItem(result.item);
      } else {
        alert(t('map.tooFar', { distance: Math.round(result.distance) }));
      }
    } catch (err) {
      console.error('Collect error:', err);
      alert(t('map.collectFailed'));
    }
  };

  const handleCloseModal = () => {
    if (collectedItem) {
      fetchItems(location[0], location[1]);
    }
    setSelectedItem(null);
    setCollectedItem(null);
  };

  const flyToLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        duration: 1000,
      });
    }
  };

  if (!isClient || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="cartoon-loader mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载地图...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cartoon-card m-2 p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center border-2 border-gray-800">
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">附近宝藏</p>
            <p className="text-2xl font-black text-amber-600">{items.length}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium">当前坐标</p>
          <p className="text-sm font-bold text-gray-700">{location[0].toFixed(4)}, {location[1].toFixed(4)}</p>
        </div>
      </div>

      {error && (
        <div className="mx-2 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 relative m-2">
        <div className="w-full h-full rounded-2xl border-4 border-gray-800 overflow-hidden">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAP_STYLE}
            mapboxAccessToken={MAPBOX_TOKEN}
            attributionControl={false}
          >
            {/* User location marker */}
            <Marker
              longitude={location[1]}
              latitude={location[0]}
              anchor="center"
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '3px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </Marker>

            {/* Item markers with circles */}
            {[...items].sort((a, b) => {
              const order = { common: 0, rare: 1, epic: 2, legendary: 3 };
              return order[a.itemRarity as ItemRarity] - order[b.itemRarity as ItemRarity];
            }).map((item) => {
              const rarity = item.itemRarity as ItemRarity;
              const color = RARITY_COLORS[rarity] || '#9ca3af';
              return (
                <Marker
                  key={`marker-${item.id}`}
                  longitude={item.longitude}
                  latitude={item.latitude}
                  anchor="center"
                  onClick={() => {
                    setSelectedItem(item);
                    flyToLocation(item.latitude, item.longitude);
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: '3px solid #333333',
                      cursor: 'pointer',
                    }}
                  />
                </Marker>
              );
            })}

            {/* Popup for selected item */}
            {selectedItem && (
              <Popup
                longitude={selectedItem.longitude}
                latitude={selectedItem.latitude}
                anchor="bottom"
                onClose={() => setSelectedItem(null)}
                closeButton={false}
                className="mapbox-popup"
              >
                <div className="text-center p-2 min-w-[120px]">
                  <b className="text-sm">{RARITY_TREASURE_NAMES[selectedItem.itemRarity as ItemRarity]}</b>
                  <br />
                  <span 
                    className="text-xs font-bold"
                    style={{ color: RARITY_COLORS[selectedItem.itemRarity as ItemRarity] }}
                  >
                    {RARITY_NAMES[selectedItem.itemRarity as ItemRarity]}
                  </span>
                </div>
              </Popup>
            )}
          </Map>
        </div>

        {/* Collection radius circles overlay - rendered via Mapbox CircleLayer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" />

        <button
          onClick={() => fetchItems(location[0], location[1])}
          className="cartoon-btn absolute top-4 right-4 z-[1000] flex items-center gap-2"
        >
          <RefreshCw size="18" /> 刷新
        </button>

        <button
          onClick={() => setShowItemPool(true)}
          className="cartoon-btn absolute top-4 left-4 z-[1000] flex items-center gap-2"
        >
          <ClipboardList size="18" /> 宝藏池
        </button>

        <div className="cartoon-card absolute bottom-4 left-4 p-2 z-[1000] opacity-90 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">稀有度</p>
          <div className="flex gap-2">
            {Object.entries(RARITY_NAMES).map(([rarity, name]) => (
              <div key={rarity} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full border-2 border-gray-800"
                  style={{ backgroundColor: RARITY_COLORS[rarity as ItemRarity] }}
                />
                <span className="text-[10px] font-bold text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedItem && !collectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="cartoon-card max-w-md w-full p-6">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800"
                style={{ backgroundColor: (RARITY_COLORS[selectedItem.itemRarity as ItemRarity] || '#9ca3af') + '30' }}
              >
                <TreasureIcon size={48} rarity={selectedItem.itemRarity as ItemRarity} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                {RARITY_TREASURE_NAMES[selectedItem.itemRarity as ItemRarity]}
              </h2>
              <p className="font-bold mb-2" style={{ color: RARITY_COLORS[selectedItem.itemRarity as ItemRarity] || '#9ca3af' }}>
                {RARITY_NAMES[selectedItem.itemRarity as ItemRarity]}
              </p>
              <p className="text-gray-500 text-sm mb-4">里面藏着什么宝物呢？</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleCollect} className="cartoon-btn flex-1">🔓 打开宝箱</button>
              <button onClick={handleCloseModal} className="cartoon-btn flex-1">离开</button>
            </div>
          </div>
        </div>
      )}

      {collectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="cartoon-card max-w-md w-full p-6">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800"
                style={{ backgroundColor: (RARITY_COLORS[collectedItem.rarity as ItemRarity] || '#9ca3af') + '20' }}
              >
                <TreasureIcon size={48} rarity={collectedItem.rarity as ItemRarity} />
              </div>
              <p className="text-gray-500 mb-2">🎉 恭喜获得！</p>
              <h2 className="text-2xl font-black text-gray-800 mb-2">{collectedItem.name}</h2>
              <p className="font-bold mb-2" style={{ color: RARITY_COLORS[collectedItem.rarity as ItemRarity] || '#9ca3af' }}>
                {RARITY_NAMES[collectedItem.rarity as ItemRarity]}
              </p>
              <p className="text-gray-600 text-sm mb-4">{collectedItem.description}</p>
            </div>
            <div className="mt-6">
              <button onClick={handleCloseModal} className="cartoon-btn w-full">✨ 太棒了！</button>
            </div>
          </div>
        </div>
      )}

      {showItemPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="cartoon-card max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <MapIcon size="24" /> 可能发现的宝藏
              </h2>
              <button onClick={() => setShowItemPool(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X size="24" />
              </button>
            </div>
            {(['legendary', 'epic', 'rare', 'common'] as ItemRarity[]).map((rarity) => {
              const rarityItems = allItems.filter(item => item.rarity === rarity);
              if (rarityItems.length === 0) return null;
              return (
                <div key={rarity} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-gray-800"
                      style={{ backgroundColor: RARITY_COLORS[rarity] }}
                    />
                    <span className="font-bold" style={{ color: RARITY_COLORS[rarity] }}>
                      {RARITY_NAMES[rarity]} ({rarityItems.length}种)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {rarityItems.map((item) => (
                      <div key={item.id} className="p-2 rounded-lg border-2 border-gray-200 bg-white/50">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            <Gem size="16" style={{ color: RARITY_COLORS[rarity] }} /> {item.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            刷新率：{(item.spawnWeight * 10).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}