'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLLECTION_RADIUS_METERS } from '@treasure-hunt/shared';
import { SpawnedItem, ItemRarity, Item } from '@/types';
import { getNearbyItems, collectItem, ApiError } from '@/lib/api';
import api from '@/lib/api';
import { TreasureIcon, RARITY_COLORS } from './Icon';
import { RefreshCw, ClipboardList, MapPin, X, Gem, Map } from 'lucide-react';

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const RARITY_TREASURE_NAMES: Record<ItemRarity, string> = {
  common: '神秘宝箱',
  rare: '闪耀宝箱',
  epic: '璀璨宝箱',
  legendary: '传说宝箱',
};

// Z-index offsets for layer ordering (higher = on top)
// User marker should always be on top, treasures sorted by rarity
const RARITY_Z_INDEX: Record<ItemRarity, number> = {
  common: 100,
  rare: 200,
  epic: 300,
  legendary: 400,
};

const USER_Z_INDEX = 1000; // User marker always on top

interface MapContentProps {
  location: [number, number];
  onItemsChange?: (items: SpawnedItem[]) => void;
}

interface SpawnedItemResponse {
  id: string;
  latitude: number;
  longitude: number;
  itemRarity: ItemRarity;
  poiName?: string;
  expiresAt: string;
  createdAt: string;
}

interface CollectedItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
}

// Map center updater
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapContent({ location, onItemsChange }: MapContentProps) {
  const [items, setItems] = useState<SpawnedItemResponse[]>([]);
  const [selectedItem, setSelectedItem] = useState<SpawnedItemResponse | null>(null);
  const [collectedItem, setCollectedItem] = useState<CollectedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemPool, setShowItemPool] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Set client flag and fix leaflet icons
  useEffect(() => {
    setIsClient(true);

    // Fix Leaflet default icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  // Create user icon with highest z-index
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="width:32px;height:32px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:${USER_Z_INDEX};"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Create item icon based on rarity with z-index for layer ordering
  const createItemIcon = (rarity: ItemRarity) => {
    return L.divIcon({
      className: 'custom-item-marker',
      html: `<div style="width:40px;height:40px;background:${RARITY_COLORS[rarity]};border:3px solid #333;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);z-index:${RARITY_Z_INDEX[rarity]};"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  // Fetch all items
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

  // Fetch nearby items
  const fetchItems = useCallback(async (lat: number, lng: number) => {
    try {
      const nearbyItems = await getNearbyItems(lat, lng);
      setItems(nearbyItems);
      setError('');
      onItemsChange?.(nearbyItems);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      if (err instanceof ApiError) {
        setError(err.message || '无法加载附近宝藏');
      } else {
        setError('无法加载附近宝藏');
      }
    } finally {
      setLoading(false);
    }
  }, [onItemsChange]);

  useEffect(() => {
    if (isClient) {
      fetchItems(location[0], location[1]);
    }
  }, [location, fetchItems, isClient]);

  const handleCollect = async () => {
    if (!selectedItem || !location) return;
    try {
      const result = await collectItem(selectedItem.id, location[0], location[1]);
      if (result.success) {
        setCollectedItem(result.item);
      } else {
        alert(`距离太远，还需要 ${Math.round(result.distance)} 米`);
      }
    } catch (err) {
      console.error('Collect error:', err);
      alert('收集失败');
    }
  };

  const handleCloseModal = () => {
    if (collectedItem) {
      fetchItems(location[0], location[1]);
    }
    setSelectedItem(null);
    setCollectedItem(null);
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
          <MapContainer
            center={location}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterUpdater center={location} />

            <Marker position={location} icon={userIcon} zIndexOffset={USER_Z_INDEX}>
              <Popup>你的位置</Popup>
            </Marker>

            {/* Sort items by rarity: common first (lowest z-index), legendary last (highest among treasures) */}
            {[...items].sort((a, b) => {
              const order = { common: 0, rare: 1, epic: 2, legendary: 3 };
              return order[a.itemRarity as ItemRarity] - order[b.itemRarity as ItemRarity];
            }).map((item) => {
              const rarity = item.itemRarity as ItemRarity;
              const color = RARITY_COLORS[rarity] || '#9ca3af';
              const zIndex = RARITY_Z_INDEX[rarity];
              return (
                <React.Fragment key={item.id}>
                  <Circle
                    center={[item.latitude, item.longitude]}
                    radius={COLLECTION_RADIUS_METERS}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.15,
                      weight: 2,
                    }}
                  />
                  <Marker
                    position={[item.latitude, item.longitude]}
                    icon={createItemIcon(rarity)}
                    zIndexOffset={zIndex}
                    eventHandlers={{
                      click: () => setSelectedItem(item),
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <b>{RARITY_TREASURE_NAMES[rarity]}</b><br />
                        <span style={{ color }}>{RARITY_NAMES[rarity]}</span>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

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

      {/* Collection popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="cartoon-card max-w-md w-full p-6">
            {!collectedItem ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Item Pool Modal */}
      {showItemPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="cartoon-card max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <Map size="24" /> 可能发现的宝藏
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
                            刷新率: {(item.spawnWeight * 10).toFixed(0)}%
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