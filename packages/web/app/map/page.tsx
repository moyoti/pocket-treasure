'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getNearbyItems, collectItem } from '@/lib/api';
import { SpawnedItem, ItemRarity } from '@/types';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom user marker icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom item marker icons by rarity
const createItemIcon = (rarity: ItemRarity) => {
  const color = RARITY_COLORS[rarity];
  return L.divIcon({
    className: 'custom-item-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">💎</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Map center updater component
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [items, setItems] = useState<SpawnedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SpawnedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchItems = useCallback(async (lat: number, lng: number) => {
    try {
      const nearbyItems = await getNearbyItems(lat, lng);
      setItems(nearbyItems);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('无法加载附近宝藏，请确保已登录');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (!user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          fetchItems(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Default to Beijing
          const defaultLat = 39.9087;
          const defaultLng = 116.3975;
          setLocation([defaultLat, defaultLng]);
          fetchItems(defaultLat, defaultLng);
          setError('无法获取位置，显示默认位置(北京天安门)');
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      const defaultLat = 39.9087;
      const defaultLng = 116.3975;
      setLocation([defaultLat, defaultLng]);
      fetchItems(defaultLat, defaultLng);
    }
  }, [user, fetchItems]);

  const handleCollect = async () => {
    if (!selectedItem || !location) return;

    try {
      const result = await collectItem(selectedItem.id, location[0], location[1]);
      if (result.success) {
        alert(`🎉 收集成功！获得了 ${selectedItem.itemName}！`);
        setSelectedItem(null);
        fetchItems(location[0], location[1]);
      } else {
        alert(`📍 距离太远，还需要 ${Math.round(result.distance)} 米`);
      }
    } catch (err) {
      alert('❌ 收集失败，请稍后重试');
    }
  };

  // Loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Loading state for location
  if (loading || !location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="cartoon-loader mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载地图...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header info bar */}
      <div className="cartoon-card m-2 p-3 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">附近宝藏</p>
          <p className="text-2xl font-black text-yellow-500">{items.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">坐标</p>
          <p className="text-sm font-bold text-gray-700">{location[0].toFixed(4)}, {location[1].toFixed(4)}</p>
        </div>
      </div>

      {error && (
        <div className="mx-2 cartoon-alert cartoon-alert-info text-sm">
          {error}
        </div>
      )}

      {/* Map container */}
      <div className="flex-1 relative m-2">
        <div className="w-full h-full rounded-2xl border-4 border-gray-800 overflow-hidden">
          <MapContainer
            center={location}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterUpdater center={location} />
            
            {/* User location marker */}
            <Marker position={location} icon={userIcon}>
              <Popup>📍 你的位置</Popup>
            </Marker>

            {/* Item markers */}
            {items.map((item) => (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={createItemIcon(item.itemRarity as ItemRarity)}
                eventHandlers={{
                  click: () => setSelectedItem(item),
                }}
              >
                <Popup>
                  <div className="text-center">
                    <b>{item.itemName}</b><br />
                    {RARITY_NAMES[item.itemRarity as ItemRarity]}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchItems(location[0], location[1])}
          className="cartoon-btn absolute top-4 right-4 z-[1000]"
        >
          🔄 刷新
        </button>

        {/* Legend */}
        <div className="cartoon-card absolute bottom-4 left-4 p-3 z-[1000]">
          <p className="text-xs font-bold text-gray-700 mb-2">稀有度</p>
          {Object.entries(RARITY_NAMES).map(([rarity, name]) => (
            <div key={rarity} className="flex items-center gap-2 mb-1">
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-800"
                style={{ backgroundColor: RARITY_COLORS[rarity as ItemRarity] }}
              />
              <span className="text-xs font-bold text-gray-700">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Collection popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card max-w-md w-full p-6 animate-bounce-in">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl border-4 border-gray-800"
                style={{ backgroundColor: RARITY_COLORS[selectedItem.itemRarity as ItemRarity] + '30' }}
              >
                💎
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">{selectedItem.itemName}</h2>
              <p className="font-bold mb-2" style={{ color: RARITY_COLORS[selectedItem.itemRarity as ItemRarity] }}>
                {RARITY_NAMES[selectedItem.itemRarity as ItemRarity]}
              </p>
              {selectedItem.poiName && (
                <p className="text-gray-500 mb-4">📍 {selectedItem.poiName}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleCollect} className="cartoon-btn flex-1">
                收集
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="cartoon-btn cartoon-btn-accent flex-1"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}