'use client';

import { useState, useEffect } from 'react';
import { useP2P } from '@/lib/p2p';
import { databaseService } from '@/lib/p2p/database';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { ItemRarity, ItemDefinition, InventoryItem } from '@/lib/p2p/types';

export default function InventoryPage() {
  const { inventory, isLoading, refreshInventory } = useP2P();
  const [filter, setFilter] = useState<ItemRarity | 'all'>('all');
  const [itemDefs, setItemDefs] = useState<Map<string, ItemDefinition>>(new Map());

  useEffect(() => {
    refreshInventory();
    databaseService.getAllItemDefinitions().then(items => {
      const map = new Map(items.map(i => [i.id, i]));
      setItemDefs(map);
    });
  }, []);

  const getItemDef = (itemId: string): ItemDefinition | undefined => itemDefs.get(itemId);

  const filteredItems = filter === 'all' 
    ? inventory 
    : inventory.filter(item => {
        const def = getItemDef(item.itemId);
        return def?.rarity === filter;
      });

  if (isLoading) {
    return <Loading fullScreen text="加载背包..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary mb-4">📦 收藏</h1>
      
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'common', 'rare', 'epic', 'legendary'].map((r) => (
          <Button
            key={r}
            variant={filter === r ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(r as ItemRarity | 'all')}
          >
            {r === 'all' ? '全部' : r}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredItems.map((item) => {
          const def = getItemDef(item.itemId);
          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {def?.rarity === 'legendary' ? '✦' : 
                     def?.rarity === 'epic' ? '★' :
                     def?.rarity === 'rare' ? '◆' : '◇'}
                  </div>
                  <div className="font-medium text-sm truncate">
                    {def?.nameZh || def?.name || item.itemId}
                  </div>
                  {def && <RarityBadge rarity={def.rarity} size="sm" />}
                  <div className="text-xs text-muted mt-1">x{item.quantity}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center text-muted py-20">
          <p className="text-4xl mb-4">📭</p>
          <p>背包空空如也</p>
          <p className="text-sm">去地图上收集宝藏吧!</p>
        </div>
      )}
    </div>
  );
}