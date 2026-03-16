'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Dynamically import MapContent with SSR disabled to avoid Leaflet issues
const MapContent = dynamic(() => import('@/components/MapContent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="cartoon-loader mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">正在加载地图...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Get user location
  useEffect(() => {
    if (!user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          setLocationLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Default to Beijing
          const defaultLat = 39.9087;
          const defaultLng = 116.3975;
          setLocation([defaultLat, defaultLng]);
          setLocationError('无法获取位置，显示默认位置(北京天安门)');
          setLocationLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      const defaultLat = 39.9087;
      const defaultLng = 116.3975;
      setLocation([defaultLat, defaultLng]);
      setLocationLoading(false);
    }
  }, [user]);

  // Loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Loading state for location
  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="text-center animate-page-enter">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border-4 border-gray-800 animate-pulse">
            <Navigation size={36} className="text-white" />
          </div>
          <p className="text-xl font-bold text-gray-800 mb-2">正在获取位置</p>
          <p className="text-gray-500 text-sm">请允许访问您的位置信息</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">定位中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {locationError && (
        <div className="mx-2 mt-2 cartoon-alert cartoon-alert-info text-sm flex items-center gap-2">
          <MapPin size={16} className="flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}
      <MapContent location={location} />
    </div>
  );
}
