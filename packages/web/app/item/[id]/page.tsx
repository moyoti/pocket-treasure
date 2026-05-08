'use client';

import { useP2P } from '@/lib/p2p';
import { databaseService } from '@/lib/p2p/database';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { ItemDefinition } from '@/lib/p2p/types';
import { useState, useEffect } from 'react';

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { inventory, sellItem, getSellPrice } = useP2P();
  const [itemDef, setItemDef] = useState<ItemDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    databaseService.getItemById(params.id).then(item => {
      setItemDef(item || null);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return <Loading fullScreen text="加载物品..." />;
  }

  const inventoryItem = inventory.find(i => i.itemId === params.id);

  if (!itemDef) {
    return (
      <div className="min-h-screen bg-background p-4">
        <p className="text-muted">物品不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="mb-4">
        <CardContent className="p-4 text-center">
          <div className="text-4xl mb-2">
            {itemDef.rarity === 'legendary' ? '✦' : 
             itemDef.rarity === 'epic' ? '★' :
             itemDef.rarity === 'rare' ? '◆' : '◇'}
          </div>
          <h1 className="text-xl font-bold">{itemDef.nameZh || itemDef.name}</h1>
          <RarityBadge rarity={itemDef.rarity} />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">描述</h3>
          <p className="text-muted text-sm">{itemDef.description}</p>
        </CardContent>
      </Card>

      {inventoryItem && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">持有信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">数量</span>
                <span>{inventoryItem.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">收集时间</span>
                <span>{new Date(inventoryItem.collectedAt).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">出售</h3>
          <p className="text-sm text-muted mb-3">
            出售价格: {getSellPrice(itemDef.id)} 金币
          </p>
          <Button 
            variant="outline" 
            onClick={() => inventoryItem && sellItem(inventoryItem.id)}
            disabled={!inventoryItem}
          >
            出售
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}