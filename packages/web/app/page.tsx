'use client';

import { useP2P } from '@/lib/p2p';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function HomePage() {
  const { isInitialized, isLoading, error, identity, profile } = useP2P();

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-500 mb-2">初始化失败</h1>
          <p className="text-muted mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !isInitialized) {
    return <Loading fullScreen text="初始化中..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🗺️</div>
        <h1 className="text-3xl font-extrabold text-primary mb-2">寻宝记</h1>
        <p className="text-muted mb-6">Treasure Hunt</p>

        <div className="text-center mb-6">
          <p className="text-lg">欢迎, <span className="font-bold">{profile?.displayName || 'Explorer'}</span>!</p>
          <p className="text-muted">金币: {profile?.coins || 0}</p>
        </div>

        <Link href="/map">
          <Button variant="primary" size="lg">
            开始探索
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 p-4 border-t border-border bg-card">
        <Link href="/map" className="text-center p-2">
          <div className="text-2xl">🗺️</div>
          <div className="text-xs">地图</div>
        </Link>
        <Link href="/inventory" className="text-center p-2">
          <div className="text-2xl">📦</div>
          <div className="text-xs">收藏</div>
        </Link>
        <Link href="/gacha" className="text-center p-2">
          <div className="text-2xl">🎰</div>
          <div className="text-xs">扭蛋</div>
        </Link>
        <Link href="/profile" className="text-center p-2">
          <div className="text-2xl">👤</div>
          <div className="text-xs">我的</div>
        </Link>
      </div>
    </div>
  );
}