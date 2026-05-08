'use client';

import { useState } from 'react';
import { useP2P } from '@/lib/p2p';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { ItemRarity } from '@/lib/p2p/types';

export default function SynthesisPage() {
  const { inventory, synthesizeItems, isLoading } = useP2P();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  if (isLoading) {
    return <Loading fullScreen text="加载合成..." />;
  }

  const handleSynthesize = async () => {
    if (selectedItems.length < 3) return;
    const res = await synthesizeItems(selectedItems, 'common_to_rare');
    if (res.success) {
      setResult(res);
      setSelectedItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary mb-4">⚗️ 合成</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">合成规则</h3>
          <p className="text-sm text-muted">
            3个普通 → 1个稀有<br/>
            3个稀有 → 1个史诗<br/>
            3个史诗 → 1个传说
          </p>
        </CardContent>
      </Card>

      <div className="mb-4">
        <h3 className="font-bold mb-2">选择物品 ({selectedItems.length}/3)</h3>
        <div className="grid grid-cols-4 gap-2">
          {inventory.filter(i => !i.isLocked).slice(0, 20).map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-lg border-2 cursor-pointer ${
                selectedItems.includes(item.id) 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border'
              }`}
              onClick={() => {
                if (selectedItems.includes(item.id)) {
                  setSelectedItems(selectedItems.filter(id => id !== item.id));
                } else if (selectedItems.length < 3) {
                  setSelectedItems([...selectedItems, item.id]);
                }
              }}
            >
              <div className="text-center text-xs">{item.itemId.slice(0, 8)}</div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        disabled={selectedItems.length < 3}
        onClick={handleSynthesize}
      >
        合成
      </Button>

      {result && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">合成结果</h3>
            <RarityBadge rarity={result.newItemRarity} />
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              关闭
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}