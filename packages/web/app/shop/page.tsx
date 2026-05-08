'use client';

import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';

export default function ShopPage() {
  const { shopItems, profile, purchaseShopItem, isLoading } = useP2P();

  if (isLoading) {
    return <Loading fullScreen text="加载商店..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">🏪 商店</h1>
        <div className="text-lg font-bold">💰 {profile?.coins || 0}</div>
      </div>

      <div className="grid gap-4">
        {shopItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{item.nameZh || item.name}</h3>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
                <div className="text-lg font-bold text-primary">{item.price}</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={(profile?.coins || 0) < item.price}
                onClick={() => purchaseShopItem(item.id, 1)}
              >
                购买
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}