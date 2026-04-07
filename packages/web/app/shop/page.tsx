'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { getShopItems, purchaseShopItem, getCoinBalance } from '@/lib/api';
import { ShopItem, ItemRarity, CoinBalance } from '@/types';
import { TreasureIcon, RARITY_COLORS } from '@/components/Icon';
import { Package, Coins, ShoppingCart, X, Check, Loader2 } from 'lucide-react';

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();

  // Helper function to translate shop items
  const translateShopItem = (item: ShopItem): ShopItem => {
    const key = item.name.toLowerCase().replace(/\s+/g, '_');
    const translatedName = t(`shop.items.${key}`) || item.name;
    const translatedDesc = t(`shop.items.${key}_desc`) || item.description;
    return {
      ...item,
      name: translatedName,
      description: translatedDesc,
    };
  };

  // Purchase modal state
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    item: ShopItem | null;
    quantity: number;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    quantity: 1,
    loading: false,
  });

  // Success modal state
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, balanceData] = await Promise.all([
        getShopItems(),
        getCoinBalance(),
      ]);
      setItems(itemsData);
      setBalance(balanceData);
    } catch (err) {
      console.error('Failed to fetch shop data:', err);
      setError('加载商店数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handlePurchase = async () => {
    if (!purchaseModal.item) return;

    setPurchaseModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await purchaseShopItem({
        shopItemId: purchaseModal.item.id,
        quantity: purchaseModal.quantity,
      });

      // Update balance
      setBalance((prev) =>
        prev ? { ...prev, balance: result.newBalance } : null
      );

      // Refresh shop items to get updated limits
      fetchData();

      setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false });
      setSuccessModal({
        isOpen: true,
        message: `成功购买 ${purchaseModal.quantity}个 ${purchaseModal.item.name}！`,
      });
    } catch (err: any) {
      setError(err.message || '购买失败');
      setPurchaseModal((prev) => ({ ...prev, loading: false }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-amber-600" />
              NPC商店
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cartoon-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 skeleton rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 skeleton w-3/4 mb-2" />
                    <div className="h-4 skeleton w-1/3" />
                  </div>
                </div>
                <div className="h-4 skeleton w-full mb-3" />
                <div className="h-10 skeleton w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-amber-600" />
            NPC商店
          </h1>
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-3 border-yellow-400 rounded-full px-4 py-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-black text-yellow-700">{balance?.balance.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-red-100 border-3 border-red-400 text-red-700 px-4 py-3 rounded-xl font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:text-red-900">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Items grid */}
      <div className="max-w-4xl mx-auto px-4 py-6 animate-page-enter">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
              <Package size={48} className="text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-600">商店暂无商品</p>
            <p className="text-gray-500 mt-2">请稍后再来看看！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((shopItem, index) => {
              const translatedItem = translateShopItem(shopItem);
              const itemRarity = (shopItem.metadata?.rarity as ItemRarity) || 'common';
              return (
              <div
                key={shopItem.id}
                className="cartoon-card p-4 flex flex-col animate-slide-in-up"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gray-800"
                    style={{ backgroundColor: RARITY_COLORS[itemRarity] + '20' }}
                  >
                    <TreasureIcon size={32} rarity={itemRarity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 truncate">{translatedItem.name}</h3>
                    <p
                      className="text-sm font-bold"
                      style={{ color: RARITY_COLORS[itemRarity] }}
                    >
                      {shopItem.category}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 flex-1 line-clamp-2">
                  {translatedItem.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span className="font-black text-yellow-600">{shopItem.price}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {shopItem.purchaseLimit > 0 ? `限购: ${shopItem.purchaseLimit}` : '无限购'}
                  </span>
                </div>

                <button
                  onClick={() => setPurchaseModal({ isOpen: true, item: shopItem, quantity: 1, loading: false })}
                  disabled={!shopItem.isAvailable || (balance?.balance ?? 0) < shopItem.price}
                  className="cartoon-btn mt-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!shopItem.isAvailable ? '已售罄' : (balance?.balance ?? 0) < shopItem.price ? '金币不足' : '购买'}
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {purchaseModal.isOpen && purchaseModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card p-6 max-w-sm w-full animate-bounce-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">确认购买</h2>
              <button
                onClick={() => setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gray-800"
                style={{ backgroundColor: RARITY_COLORS[(purchaseModal.item.metadata?.rarity as ItemRarity) || 'common'] + '20' }}
              >
                <TreasureIcon size={32} rarity={(purchaseModal.item.metadata?.rarity as ItemRarity) || 'common'} />
              </div>
              <div>
                <p className="font-black text-gray-800">{translateShopItem(purchaseModal.item).name}</p>
                <p className="text-sm font-bold text-gray-500">
                  {purchaseModal.item.category}
                </p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setPurchaseModal((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                className="w-10 h-10 rounded-full border-3 border-gray-800 font-black text-xl hover:bg-gray-100"
              >
                -
              </button>
              <span className="text-2xl font-black text-gray-800 w-12 text-center">{purchaseModal.quantity}</span>
              <button
                onClick={() => setPurchaseModal((prev) => ({
                  ...prev,
                  quantity: Math.min((prev.item?.purchaseLimit ?? 0) > 0 ? prev.item!.purchaseLimit : 99, prev.quantity + 1)
                }))}
                className="w-10 h-10 rounded-full border-3 border-gray-800 font-black text-xl hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 mb-4 border-2 border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600">总计:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span className="text-xl font-black text-yellow-600">
                    {purchaseModal.item.price * purchaseModal.quantity}
                  </span>
                </div>
              </div>
              {balance && balance.balance < purchaseModal.item.price * purchaseModal.quantity && (
                <p className="text-red-500 text-sm font-bold mt-2">金币不足！</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false })}
                className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchaseModal.loading || (balance !== null && balance.balance < purchaseModal.item.price * purchaseModal.quantity)}
                className="cartoon-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {purchaseModal.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    确认
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card p-6 max-w-sm w-full animate-bounce-in text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">购买成功！</h2>
            <p className="text-gray-600 mb-4">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ isOpen: false, message: '' })}
              className="cartoon-btn w-full"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}