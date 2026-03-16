'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Map, Gem } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.push('/map');
        } else {
          router.push('/login');
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="animate-bounce-in text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg border-4 border-gray-800 animate-chest-bounce">
            <Map size={44} className="text-gray-800" />
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-3 border-gray-800 -ml-5 mt-8 animate-float">
            <Gem size={28} className="text-gray-800" />
          </div>
        </div>
        <h1 className="cartoon-title text-5xl md:text-6xl mb-3">寻宝记</h1>
        <p className="text-lg text-gray-600 font-semibold mb-8">探索世界，收集宝藏</p>
        <div className="cartoon-loader mx-auto"></div>
      </div>
    </div>
  );
}
