'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getInventoryItem } from '@/lib/api';
import { RARITY_COLORS, RARITY_BG_COLORS, getRarityIcon } from '@/components/Icon';
import { MapPin, Calendar, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { InventoryItem, ItemRarity } from '@/types';

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      fetchItem();
    }
  }, [user, id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await getInventoryItem(id);
      setItem(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch item:', err);
      setError('物品不存在或已被移除');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !item) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="text-center cartoon-card p-8 max-w-sm">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
            <Package size={48} className="text-gray-400" />
          </div>
          <p className="text-xl font-black text-gray-800 mb-2">物品未找到</p>
          <p className="text-gray-500 font-bold mb-6">{error}</p>
          <button onClick={() => router.back()} className="cartoon-btn w-full">
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
        </div>
      </div>
    );
  }

  const rarity = item.item.rarity as ItemRarity;
  const rarityIcon = getRarityIcon(rarity);
  const RarityIconComponent = rarityIcon;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border-3 border-gray-800 bg-white hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-xl font-black text-gray-800">物品详情</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 animate-page-enter">
        <div className="cartoon-card p-6 mb-6 text-center">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center border-4 border-gray-800 shadow-lg"
            style={{ backgroundColor: RARITY_BG_COLORS[rarity] }}
          >
            <RarityIconComponent size={64} color={RARITY_COLORS[rarity]} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-3">{item.item.name}</h2>
          <span
            className="inline-block px-4 py-2 rounded-xl font-black text-sm"
            style={{
              backgroundColor: RARITY_BG_COLORS[rarity],
              color: RARITY_COLORS[rarity],
            }}
          >
            {RARITY_NAMES[rarity]}
          </span>
        </div>

        <div className="cartoon-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">物品描述</h3>
          </div>
          <p className="text-gray-700 font-bold leading-relaxed">{item.item.description}</p>
        </div>

        <div className="cartoon-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">收集信息</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-gray-600">收集地点</span>
              </div>
              <span className="font-black text-gray-800">{item.poiName || '未知'}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-bold text-gray-600">收集时间</span>
              </div>
              <span className="font-black text-gray-800">
                {new Date(item.collectedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-bold text-gray-600">数量</span>
              </div>
              <span
                className="px-4 py-2 rounded-xl font-black bg-amber-100 text-amber-700 border-2 border-amber-300"
              >
                x{item.quantity}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="cartoon-btn w-full flex items-center justify-center gap-2 py-4 text-lg"
        >
          <ArrowLeft className="w-6 h-6" />
          返回背包
        </button>
      </div>
    </div>
  );
}
