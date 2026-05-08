'use client';

import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';

export default function ExplorationPage() {
  const { visitedAreas, areaUnlockProgress, isLoading } = useP2P();

  if (isLoading) {
    return <Loading fullScreen text="加载探索区域..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">🗺️ 探索区域</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span>解锁进度</span>
            <span className="font-bold">{areaUnlockProgress.unlocked} / {areaUnlockProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-primary rounded-full h-2" 
              style={{ width: `${areaUnlockProgress.total > 0 ? (areaUnlockProgress.unlocked / areaUnlockProgress.total) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <h3 className="font-bold mb-2">已访问区域</h3>
      <div className="space-y-2">
        {visitedAreas.map((area) => (
          <Card key={area.id}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{area.areaNameZh || area.areaName}</p>
                  <p className="text-xs text-muted">
                    访问 {area.visitCount} 次
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  area.isUnlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {area.isUnlocked ? '已解锁' : '未解锁'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {visitedAreas.length === 0 && (
          <p className="text-muted text-center py-4">开始探索地图来解锁区域!</p>
        )}
      </div>
    </div>
  );
}