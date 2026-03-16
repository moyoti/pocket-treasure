'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { getGachaPools, pullGacha, getCoinBalance } from '@/lib/api';
import { GachaPool, ItemRarity, CoinBalance } from '@/types';
import { TreasureIcon, RARITY_COLORS } from '@/components/Icon';
import {
  Dices,
  Coins,
  X,
  Check,
  Loader2,
  Sparkles,
  Star,
  Gift,
  Zap,
} from 'lucide-react';

const RARITY_NAMES_ZH: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export default function GachaPage() {
  const [pools, setPools] = useState<GachaPool[]>([]);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  // Selected pool
  const [selectedPool, setSelectedPool] = useState<GachaPool | null>(null);

  // Pull animation state
  const [pullState, setPullState] = useState<{
    isPulling: boolean;
    pityCount: number;
  }>({
    isPulling: false,
    pityCount: 0,
  });

  // Result modal
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    results: {
      item: {
        id: string;
        name: string;
        rarity: ItemRarity;
        description: string;
      };
      rarity: ItemRarity;
      isPity: boolean;
    }[];
  }>({
    isOpen: false,
    results: [],
  });

  const fetchData = useCallback(async () => {
    try {
      const [poolsData, balanceData] = await Promise.all([
        getGachaPools(),
        getCoinBalance(),
      ]);
      setPools(poolsData);
      setBalance(balanceData);
      if (poolsData.length > 0) {
        setSelectedPool(poolsData[0]);
      }
    } catch (err) {
      console.error('Failed to fetch gacha data:', err);
      setError('加载抽奖数据失败');
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

  const handlePull = async (pullType: 'single' | 'ten') => {
    if (!selectedPool) return;

    const cost = pullType === 'single' ? selectedPool.singlePrice : selectedPool.tenPrice;
    if (balance && balance.balance < cost) {
      setError(t('shop.insufficientCoins'));
      return;
    }

    setPullState((prev) => ({ ...prev, isPulling: true }));
    setError('');

    try {
      const result = await pullGacha({
        poolId: selectedPool.id,
        pullType,
      });

      // Update balance
      setBalance((prev) =>
        prev ? { ...prev, balance: result.newCoinBalance } : null
      );

      // Set results with animation delay
      setTimeout(() => {
        setPullState((prev) => ({
          ...prev,
          isPulling: false,
          pityCount: result.newPityCount,
        }));
        setResultModal({
          isOpen: true,
          results: result.results,
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setPullState((prev) => ({ ...prev, isPulling: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <Dices className="w-7 h-7 text-purple-500" />
              {t('gacha.title')}
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="cartoon-card p-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 skeleton rounded-full mb-4" />
              <div className="h-6 skeleton w-40 mb-2" />
              <div className="h-4 skeleton w-60 mb-6" />
            </div>
            <div className="skeleton rounded-xl h-20 mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="h-24 skeleton rounded-xl" />
              <div className="h-24 skeleton rounded-xl" />
            </div>
            <div className="skeleton rounded-xl h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Dices className="w-7 h-7 text-purple-500" />
            {t('gacha.title')}
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

      {/* Pool selector */}
      {pools.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pools.map((pool) => (
              <button
                key={pool.id}
                onClick={() => setSelectedPool(pool)}
                className={`px-4 py-2 rounded-xl font-bold border-3 border-gray-800 whitespace-nowrap transition ${
                  selectedPool?.id === pool.id
                    ? 'bg-purple-200 text-purple-800'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pool.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main gacha area */}
      <div className="max-w-4xl mx-auto px-4 py-6 animate-page-enter">
        {selectedPool ? (
          <div className="cartoon-card p-6">
            {/* Pool info */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center border-4 border-gray-800 shadow-lg animate-float">
                <Gift className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-800">{selectedPool.name}</h2>
              <p className="text-gray-500 mt-2">{selectedPool.description}</p>
            </div>

            {/* Guarantee progress */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-700">
                  {t('gacha.pityProgress')}
                </span>
                <span className="font-black text-purple-600">
                  {pullState.pityCount} / {selectedPool.pityThreshold}
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                  style={{ width: `${(pullState.pityCount / selectedPool.pityThreshold) * 100}%` }}
                />
              </div>
              <p className="text-sm text-purple-600 mt-2">
                {selectedPool.pityThreshold}{t('gacha.dropRates').charAt(0)}{RARITY_NAMES_ZH[selectedPool.pityMinRarity]}+!
              </p>
            </div>

            {/* Pull buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handlePull('single')}
                disabled={pullState.isPulling || (balance !== null && balance.balance < selectedPool.singlePrice)}
                className="cartoon-btn py-4 flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {pullState.isPulling ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    <span className="font-black">{t('gacha.singlePull')}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4" />
                      {selectedPool.singlePrice}
                    </div>
                  </>
                )}
              </button>
              <button
                onClick={() => handlePull('ten')}
                disabled={pullState.isPulling || (balance !== null && balance.balance < selectedPool.tenPrice)}
                className="cartoon-btn cartoon-btn-accent py-4 flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {pullState.isPulling ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span className="font-black">{t('gacha.tenPull')}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4" />
                      {selectedPool.tenPrice}
                      <span className="text-xs opacity-75">({t('gacha.discount')})</span>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Pulling animation */}
            {pullState.isPulling && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center border-4 border-gray-800 animate-bounce">
                  <Dices className="w-10 h-10 text-white animate-spin" />
                </div>
                <p className="text-xl font-black text-gray-800 animate-pulse">{t('gacha.pulling')}</p>
              </div>
            )}

            {/* Drop rates */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {t('gacha.dropRates')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {['legendary', 'epic', 'rare', 'common'].map((rarity) => {
                  const items = selectedPool.items.filter((i) => i.rarity === rarity);
                  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
                  const poolTotalWeight = selectedPool.items.reduce((sum, i) => sum + i.weight, 0);
                  const percentage = poolTotalWeight > 0 ? ((totalWeight / poolTotalWeight) * 100).toFixed(1) : '0';

                  return (
                    <div key={rarity} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <span
                        className="font-bold"
                        style={{ color: RARITY_COLORS[rarity as ItemRarity] }}
                      >
                        {t(`inventory.rarity.${rarity}`)}
                      </span>
                      <span className="font-bold text-gray-600">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
              <Dices size={48} className="text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-600">{t('gacha.noPool')}</p>
            <p className="text-gray-500 mt-2">{t('common.retry')}</p>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {resultModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="cartoon-card p-6 max-w-md w-full animate-bounce-in my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">{t('gacha.results')}!</h2>
              <button
                onClick={() => setResultModal({ isOpen: false, results: [] })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {resultModal.results.map((result, index) => (
                <div
                  key={`${result.item.id}-${index}`}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 animate-slide-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gray-800"
                    style={{ backgroundColor: RARITY_COLORS[result.rarity] + '20' }}
                  >
                    <TreasureIcon size={32} rarity={result.rarity} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-800">{result.item.name}</p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: RARITY_COLORS[result.rarity] }}
                    >
                      {t(`inventory.rarity.${result.rarity}`)}
                    </p>
                    {result.isPity && (
                      <p className="text-xs text-purple-600 font-bold">✨ {t('gacha.pityTriggered')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setResultModal({ isOpen: false, results: [] })}
              className="cartoon-btn w-full mt-4"
            >
              <Check className="w-5 h-5 mr-2" />
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}