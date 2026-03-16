'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getInventory, getInventoryStats, sellItemToNPC, getCoinBalance } from '@/lib/api';
import { InventoryItem, ItemRarity, CoinBalance } from '@/types';
import { TreasureIcon, RARITY_COLORS } from '@/components/Icon';
import { Package, MapPin, Coins, X, Check, Loader2, ShoppingCart, Tag } from 'lucide-react';

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

// NPC buy prices by rarity
const NPC_PRICES: Record<ItemRarity, number> = {
  common: 5,
  rare: 25,
  epic: 100,
  legendary: 500,
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Sell modal state
  const [sellModal, setSellModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
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
    coinsEarned: number;
  }>({
    isOpen: false,
    message: '',
    coinsEarned: 0,
  });

  // Selection mode for batch sell
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [inventoryData, statsData, balanceData] = await Promise.all([
        getInventory(),
        getInventoryStats(),
        getCoinBalance(),
      ]);
      setItems(inventoryData);
      setStats(statsData);
      setBalance(balanceData);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setError('加载背包失败');
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

  const handleSell = async () => {
    if (!sellModal.item) return;

    setSellModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await sellItemToNPC({
        inventoryItemId: sellModal.item.id,
        quantity: sellModal.quantity,
      });

      // Update balance
      setBalance((prev) =>
        prev ? { ...prev, balance: result.newBalance } : null
      );

      // Update item quantity
      setItems((prev) =>
        prev
          .map((item) =>
            item.id === sellModal.item?.id
              ? { ...item, quantity: item.quantity - sellModal.quantity }
              : item
          )
          .filter((item) => item.quantity > 0)
      );

      // Update stats
      setStats((prev: any) =>
        prev ? { ...prev, totalItems: prev.totalItems - sellModal.quantity } : null
      );

      setSellModal({ isOpen: false, item: null, quantity: 1, loading: false });
      setSuccessModal({
        isOpen: true,
        message: `成功出售 ${sellModal.quantity}个 ${sellModal.item.item.name}！`,
        coinsEarned: result.totalPrice || 0,
      });
    } catch (err: any) {
      setError(err.message || '出售失败');
      setSellModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleBatchSell = async () => {
    if (selectedItems.size === 0) return;

    const totalCoins = Array.from(selectedItems).reduce((sum, itemId) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        return sum + NPC_PRICES[item.item.rarity as ItemRarity] * item.quantity;
      }
      return sum;
    }, 0);

    if (!confirm(`确定以 ${totalCoins} 金币出售 ${selectedItems.size} 个物品？`)) return;

    // Sell each selected item
    try {
      for (const itemId of Array.from(selectedItems)) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          await sellItemToNPC({
            inventoryItemId: item.id,
            quantity: item.quantity,
          });
        }
      }

      // Refresh data
      fetchData();
      setSelectedItems(new Set());
      setSelectionMode(false);

      setSuccessModal({
        isOpen: true,
        message: `成功出售 ${selectedItems.size} 个物品！`,
        coinsEarned: totalCoins,
      });
    } catch (err: any) {
      setError(err.message || '出售失败');
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Calculate total value of selected items
  const selectedTotalValue = Array.from(selectedItems).reduce((sum, itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      return sum + NPC_PRICES[item.item.rarity as ItemRarity] * item.quantity;
    }
    return sum;
  }, 0);

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
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-600" />
              我的收藏
            </h1>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cartoon-card p-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 skeleton flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 skeleton w-3/4 mb-2" />
                    <div className="h-4 skeleton w-1/3" />
                  </div>
                </div>
                <div className="h-4 skeleton w-full mt-3" />
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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            我的收藏
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-3 border-yellow-400 rounded-full px-4 py-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="font-black text-yellow-700">{balance?.balance.toLocaleString() || 0}</span>
            </div>
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedItems(new Set());
              }}
              className={`p-2 rounded-xl border-3 border-gray-800 font-bold transition ${
                selectionMode ? 'bg-yellow-400' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Tag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white border-b-4 border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex justify-center gap-6 md:gap-12 overflow-x-auto">
              <div className="text-center flex-shrink-0">
                <p className="text-2xl md:text-3xl font-black text-gray-800">{stats.totalItems}</p>
                <p className="text-xs md:text-sm text-gray-500 font-bold">总数</p>
              </div>
              <div className="text-center flex-shrink-0">
                <p className="text-2xl md:text-3xl font-black text-gray-800">{stats.uniqueItems}</p>
                <p className="text-xs md:text-sm text-gray-500 font-bold">种类</p>
              </div>
              {Object.entries(stats.byRarity).map(([rarity, count]) => (
                <div key={rarity} className="text-center flex-shrink-0">
                  <p className="text-2xl md:text-3xl font-black" style={{ color: RARITY_COLORS[rarity as ItemRarity] }}>
                    {count as number}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 font-bold">{RARITY_NAMES[rarity as ItemRarity]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-red-100 border-3 border-red-400 text-red-700 px-4 py-3 rounded-xl font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:text-red-900">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Batch sell bar */}
      {selectionMode && (
        <div className="sticky top-[72px] z-30 bg-purple-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-bold">{selectedItems.size} 个已选</span>
              <span className="ml-4 font-black text-yellow-300">
                = {selectedTotalValue.toLocaleString()} 金币
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItems(new Set(items.map((i) => i.id)))}
                className="px-4 py-2 rounded-xl bg-white/20 font-bold hover:bg-white/30 transition"
              >
                全选
              </button>
              <button
                onClick={handleBatchSell}
                disabled={selectedItems.size === 0}
                className="px-4 py-2 rounded-xl bg-yellow-400 text-gray-800 font-bold hover:bg-yellow-300 transition disabled:opacity-50"
              >
                全部出售
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items grid */}
      <div className="max-w-6xl mx-auto px-4 py-6 animate-page-enter">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
              <Package size={48} className="text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-600">还没有收集物品</p>
            <p className="text-gray-500 mt-2">去地图探索寻找宝藏吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                onClick={() => selectionMode && toggleItemSelection(item.id)}
                className={`cartoon-card p-4 cursor-pointer transition relative animate-slide-in-up ${
                  selectedItems.has(item.id) ? 'ring-4 ring-purple-400 bg-purple-50' : ''
                }`}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
              >
                {selectionMode && (
                  <div className="absolute top-2 right-2">
                    <div
                      className={`w-6 h-6 rounded-full border-3 flex items-center justify-center ${
                        selectedItems.has(item.id)
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {selectedItems.has(item.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-800"
                    style={{ backgroundColor: RARITY_COLORS[item.item.rarity as ItemRarity] + '20' }}
                  >
                    <TreasureIcon size={32} rarity={item.item.rarity as ItemRarity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 truncate">{item.item.name}</h3>
                    <p
                      className="text-sm font-bold"
                      style={{ color: RARITY_COLORS[item.item.rarity as ItemRarity] }}
                    >
                      {RARITY_NAMES[item.item.rarity as ItemRarity]}
                    </p>
                    {item.poiName && (
                      <p className="text-xs text-gray-500 mt-1 truncate flex items-center gap-1">
                        <MapPin size="12" /> {item.poiName}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-lg flex-shrink-0 border-2 border-gray-300">
                    <span className="font-black text-gray-800">x{item.quantity}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{item.item.description}</p>

                {/* Price and sell button */}
                {!selectionMode && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-gray-200">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-yellow-600">
                        {NPC_PRICES[item.item.rarity as ItemRarity]} 金币
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSellModal({ isOpen: true, item, quantity: 1, loading: false });
                      }}
                      className="cartoon-btn cartoon-btn-sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      出售
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {sellModal.isOpen && sellModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card p-6 max-w-sm w-full animate-bounce-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">出售给NPC</h2>
              <button
                onClick={() => setSellModal({ isOpen: false, item: null, quantity: 1, loading: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gray-800"
                style={{ backgroundColor: RARITY_COLORS[sellModal.item.item.rarity as ItemRarity] + '20' }}
              >
                <TreasureIcon size={32} rarity={sellModal.item.item.rarity as ItemRarity} />
              </div>
              <div>
                <p className="font-black text-gray-800">{sellModal.item.item.name}</p>
                <p
                  className="text-sm font-bold"
                  style={{ color: RARITY_COLORS[sellModal.item.item.rarity as ItemRarity] }}
                >
                  {RARITY_NAMES[sellModal.item.item.rarity as ItemRarity]}
                </p>
                <p className="text-sm text-gray-500">拥有: {sellModal.item.quantity}</p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mb-4">
              <label className="font-bold text-gray-700 block mb-2">数量</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSellModal((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  className="w-10 h-10 rounded-full border-3 border-gray-800 font-black text-xl hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-2xl font-black text-gray-800 w-12 text-center">{sellModal.quantity}</span>
                <button
                  onClick={() => setSellModal((prev) => ({
                    ...prev,
                    quantity: Math.min(prev.item?.quantity || 1, prev.quantity + 1)
                  }))}
                  className="w-10 h-10 rounded-full border-3 border-gray-800 font-black text-xl hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 mb-4 border-2 border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-600">您将获得:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span className="text-xl font-black text-yellow-600">
                    {NPC_PRICES[sellModal.item.item.rarity as ItemRarity] * sellModal.quantity}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSellModal({ isOpen: false, item: null, quantity: 1, loading: false })}
                className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleSell}
                disabled={sellModal.loading}
                className="cartoon-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sellModal.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    出售
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
              <Coins className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">已出售！</h2>
            <p className="text-gray-600 mb-2">{successModal.message}</p>
            <p className="text-2xl font-black text-yellow-600 mb-4">
              +{successModal.coinsEarned} 金币
            </p>
            <button
              onClick={() => setSuccessModal({ isOpen: false, message: '', coinsEarned: 0 })}
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