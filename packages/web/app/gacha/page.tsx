'use client';

import { useState } from 'react';
import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { RarityBadge } from '@/components/ui/RarityBadge';

export default function GachaPage() {
  const { gachaPools, profile, pullGacha, gachaPities, isLoading } = useP2P();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  if (isLoading) {
    return <Loading fullScreen text="加载扭蛋..." />;
  }

  const handlePull = async (poolId: string, pullType: 'single' | 'ten') => {
    setPulling(true);
    try {
      const result = await pullGacha(poolId, pullType);
      if (result.success) {
        setResults(result.items);
      }
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">🎰 扭蛋</h1>
        <div className="text-lg font-bold">💰 {profile?.coins || 0}</div>
      </div>

      <div className="grid gap-4">
        {gachaPools.map((pool) => (
          <Card key={pool.id}>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-1">{pool.nameZh || pool.name}</h3>
              <p className="text-sm text-muted mb-3">{pool.description}</p>
              
              <div className="text-sm text-muted mb-3">
                保底进度: {gachaPities[pool.id]?.pityCount || 0} / {pool.pityThreshold}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => handlePull(pool.id, 'single')}
                  disabled={pulling || (profile?.coins || 0) < pool.singlePrice}
                >
                  单抽 ({pool.singlePrice})
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePull(pool.id, 'ten')}
                  disabled={pulling || (profile?.coins || 0) < pool.tenPrice}
                >
                  十连 ({pool.tenPrice})
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-4 text-center">抽奖结果</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {results.map((item, i) => (
                  <div key={i} className="text-center">
                    <RarityBadge rarity={item.rarity} size="sm" />
                  </div>
                ))}
              </div>
              <Button variant="primary" onClick={() => setResults([])}>
                关闭
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}