'use client';

import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';

export default function StatsPage() {
  const { profile, inventory } = useP2P();

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">📊 统计数据</h1>

      <div className="grid gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-sm">总收集物品</div>
            <div className="text-3xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-sm">总获得金币</div>
            <div className="text-3xl font-bold text-primary">{profile?.totalCoinsEarned || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-sm">总花费金币</div>
            <div className="text-3xl font-bold">{profile?.totalCoinsSpent || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-sm">等级</div>
            <div className="text-3xl font-bold">{profile?.level || 1}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}