'use client';

import { useState, useEffect } from 'react';
import { useP2P } from '@/lib/p2p';
import { databaseService } from '@/lib/p2p/database';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { CosmeticDefinition } from '@/lib/p2p/types';

export default function CosmeticsPage() {
  const { userCosmetics, purchaseCosmetic, equipCosmetic, unequipCosmetic, profile, isLoading } = useP2P();
  const [cosmetics, setCosmetics] = useState<CosmeticDefinition[]>([]);

  useEffect(() => {
    databaseService.getCosmetics().then(setCosmetics);
  }, []);

  if (isLoading) {
    return <Loading fullScreen text="加载装饰品..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">🎨 装饰品</h1>
        <div className="text-lg font-bold">💰 {profile?.coins || 0}</div>
      </div>

      <h3 className="font-bold mb-2">商店</h3>
      <div className="grid gap-4 mb-6">
        {cosmetics.map((cosmetic) => {
          const owned = userCosmetics.find(uc => uc.cosmeticId === cosmetic.id);
          return (
            <Card key={cosmetic.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold">{cosmetic.nameZh || cosmetic.name}</h4>
                    <p className="text-sm text-muted">{cosmetic.description}</p>
                    <RarityBadge rarity={cosmetic.rarity} size="sm" />
                  </div>
                  <div className="text-lg font-bold text-primary">{cosmetic.price}</div>
                </div>

                {owned ? (
                  owned.isEquipped ? (
                    <Button variant="outline" size="sm" onClick={() => unequipCosmetic(cosmetic.type)}>
                      取消装备
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => equipCosmetic(cosmetic.id)}>
                      装备
                    </Button>
                  )
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={(profile?.coins || 0) < cosmetic.price}
                    onClick={() => purchaseCosmetic(cosmetic.id)}
                  >
                    购买
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}