'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  getMarketListings,
  getMyListings,
  createMarketListing,
  buyMarketListing,
  cancelMarketListing,
  getCoinBalance,
  getInventory,
} from '@/lib/api';
import { MarketListing, ItemRarity, CoinBalance, InventoryItem } from '@/types';
import { TreasureIcon, RARITY_COLORS } from '@/components/Icon';
import {
  Store,
  Coins,
  X,
  Check,
  Loader2,
  Search,
  Filter,
  Package,
  Tag,
  TrendingUp,
  User,
} from 'lucide-react';

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const RARITY_BG_COLORS: Record<ItemRarity, string> = {
  common: '#E5E7EB',
  rare: '#DBEAFE',
  epic: '#EDE9FE',
  legendary: '#FEF3C7',
};

const MARKET_FEE_RATE = 0.1; // 10%

export default function MarketPage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<'market' | 'my'>('market');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Purchase modal state
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    listing: MarketListing | null;
    loading: boolean;
  }>({
    isOpen: false,
    listing: null,
    loading: false,
  });

  // Sell modal state
  const [sellModal, setSellModal] = useState<{
    isOpen: boolean;
    inventoryItem: InventoryItem | null;
    quantity: number;
    price: number;
    loading: boolean;
  }>({
    isOpen: false,
    inventoryItem: null,
    quantity: 1,
    price: 100,
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
      const [listingsData, balanceData] = await Promise.all([
        getMarketListings(),
        getCoinBalance(),
      ]);
      setListings(listingsData);
      setBalance(balanceData);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError('加载市场数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    try {
      const [myListingsData, inventoryData] = await Promise.all([
        getMyListings(),
        getInventory(),
      ]);
      setMyListings(myListingsData);
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to fetch my listings:', err);
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

  useEffect(() => {
    if (activeTab === 'my' && user) {
      fetchMyListings();
    }
  }, [activeTab, user, fetchMyListings]);

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = !rarityFilter || listing.item.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const handleBuy = async () => {
    if (!purchaseModal.listing) return;

    setPurchaseModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await buyMarketListing(purchaseModal.listing.id);

      // Update balance
      setBalance((prev) =>
        prev ? { ...prev, balance: result.newBalance } : null
      );

      // Remove listing from list
      setListings((prev) => prev.filter((l) => l.id !== purchaseModal.listing?.id));

      setPurchaseModal({ isOpen: false, listing: null, loading: false });
      setSuccessModal({
        isOpen: true,
        message: `成功购买 ${purchaseModal.listing.item.name}！`,
      });
    } catch (err: any) {
      setError(err.message || '购买失败');
      setPurchaseModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCreateListing = async () => {
    if (!sellModal.inventoryItem) return;

    setSellModal((prev) => ({ ...prev, loading: true }));
    try {
      await createMarketListing({
        inventoryItemId: sellModal.inventoryItem.id,
        quantity: sellModal.quantity,
        price: sellModal.price,
      });

      // Refresh data
      fetchMyListings();

      setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false });
      setSuccessModal({
        isOpen: true,
        message: `成功上架 ${sellModal.inventoryItem.item.name}！`,
      });
    } catch (err: any) {
      setError(err.message || '上架失败');
      setSellModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('确定要取消这个上架吗？')) return;

    try {
      await cancelMarketListing(listingId);
      setMyListings((prev) => prev.filter((l) => l.id !== listingId));
      setSuccessModal({
        isOpen: true,
        message: '上架已取消！',
      });
    } catch (err: any) {
      setError(err.message || '取消上架失败');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
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
            <Store className="w-7 h-7 text-blue-500" />
            交易市场
          </h1>
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-3 border-yellow-400 rounded-full px-4 py-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-black text-yellow-700">{balance?.balance.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mt-4 flex gap-2">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold border-3 border-gray-800 transition ${
              activeTab === 'market'
                ? 'bg-yellow-400 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            浏览
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold border-3 border-gray-800 transition ${
              activeTab === 'my'
                ? 'bg-yellow-400 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            我的上架
          </button>
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

      {activeTab === 'market' && (
        <>
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索物品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-3 border-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border-3 border-gray-800 font-bold transition ${
                  showFilters ? 'bg-yellow-400' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Filter options */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white rounded-xl border-3 border-gray-800">
                <p className="font-bold text-gray-700 mb-2">按稀有度筛选:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRarityFilter('')}
                    className={`px-4 py-2 rounded-full font-bold border-2 transition ${
                      rarityFilter === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    全部
                  </button>
                  {(['common', 'rare', 'epic', 'legendary'] as ItemRarity[]).map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarity)}
                      className={`px-4 py-2 rounded-full font-bold border-2 transition ${
                        rarityFilter === rarity
                          ? 'text-gray-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: rarityFilter === rarity ? RARITY_BG_COLORS[rarity] : undefined,
                        borderColor: RARITY_COLORS[rarity],
                      }}
                    >
                      {RARITY_NAMES[rarity]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Listings grid */}
          <div className="max-w-4xl mx-auto px-4 pb-6 animate-page-enter">
            {filteredListings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                  <Package size={48} className="text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-600">未找到物品</p>
                <p className="text-gray-500 mt-2">请调整搜索条件或筛选</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="cartoon-card p-4 flex flex-col animate-slide-in-up"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gray-800"
                        style={{ backgroundColor: RARITY_COLORS[listing.item.rarity as ItemRarity] + '20' }}
                      >
                        <TreasureIcon size={32} rarity={listing.item.rarity as ItemRarity} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-800 truncate">{listing.item.name}</h3>
                        <p
                          className="text-sm font-bold"
                          style={{ color: RARITY_COLORS[listing.item.rarity as ItemRarity] }}
                        >
                          {RARITY_NAMES[listing.item.rarity as ItemRarity]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <User className="w-4 h-4" />
                      <span>{listing.seller.username}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-black text-yellow-600">{listing.price.toLocaleString()}</span>
                      </div>
                      <span className="text-sm text-gray-500">x{listing.quantity}</span>
                    </div>

                    <button
                      onClick={() => setPurchaseModal({ isOpen: true, listing, loading: false })}
                      disabled={balance !== null && balance.balance < listing.price}
                      className="cartoon-btn mt-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {balance !== null && balance.balance < listing.price ? '金币不足' : '购买'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'my' && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Create listing button */}
          <div className="mb-6">
            <h2 className="text-lg font-black text-gray-800 mb-4">出售物品</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inventory.filter((item) => item.quantity > 0).map((item) => (
                <div
                  key={item.id}
                  className="cartoon-card p-4 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-800"
                    style={{ backgroundColor: RARITY_COLORS[item.item.rarity as ItemRarity] + '20' }}
                  >
                    <TreasureIcon size={24} rarity={item.item.rarity as ItemRarity} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 truncate">{item.item.name}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                  </div>
                  <button
                    onClick={() => setSellModal({ isOpen: true, inventoryItem: item, quantity: 1, price: 100, loading: false })}
                    className="cartoon-btn cartoon-btn-sm"
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    出售
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* My listings */}
          <div>
            <h2 className="text-lg font-black text-gray-800 mb-4">我的上架列表</h2>
            {myListings.length === 0 ? (
              <div className="text-center py-12 cartoon-card">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                  <Package size={40} className="text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-bold">暂无上架物品</p>
                <p className="text-gray-500 mt-2">从背包中选择物品上架出售</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="cartoon-card p-4 flex items-center gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-800"
                      style={{ backgroundColor: RARITY_COLORS[listing.item.rarity as ItemRarity] + '20' }}
                    >
                      <TreasureIcon size={24} rarity={listing.item.rarity as ItemRarity} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 truncate">{listing.item.name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-yellow-600">{listing.price.toLocaleString()}</span>
                        <span className="text-gray-500">x{listing.quantity}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelListing(listing.id)}
                      className="px-4 py-2 rounded-xl border-3 border-red-400 text-red-600 font-bold hover:bg-red-50 transition"
                    >
                      取消
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {purchaseModal.isOpen && purchaseModal.listing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card p-6 max-w-sm w-full animate-bounce-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">确认购买</h2>
              <button
                onClick={() => setPurchaseModal({ isOpen: false, listing: null, loading: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gray-800"
                style={{ backgroundColor: RARITY_COLORS[purchaseModal.listing.item.rarity as ItemRarity] + '20' }}
              >
                <TreasureIcon size={32} rarity={purchaseModal.listing.item.rarity as ItemRarity} />
              </div>
              <div>
                <p className="font-black text-gray-800">{purchaseModal.listing.item.name}</p>
                <p className="text-sm text-gray-500">卖家: {purchaseModal.listing.seller.username}</p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 mb-4 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600">价格:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-xl font-black text-yellow-600">
                    {purchaseModal.listing.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>数量:</span>
                <span>x{purchaseModal.listing.quantity}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPurchaseModal({ isOpen: false, listing: null, loading: false })}
                className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleBuy}
                disabled={purchaseModal.loading}
                className="cartoon-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {purchaseModal.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    购买
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {sellModal.isOpen && sellModal.inventoryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card p-6 max-w-sm w-full animate-bounce-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800">创建上架</h2>
              <button
                onClick={() => setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-gray-800"
                style={{ backgroundColor: RARITY_COLORS[sellModal.inventoryItem.item.rarity as ItemRarity] + '20' }}
              >
                <TreasureIcon size={32} rarity={sellModal.inventoryItem.item.rarity as ItemRarity} />
              </div>
              <div>
                <p className="font-black text-gray-800">{sellModal.inventoryItem.item.name}</p>
                <p className="text-sm text-gray-500">拥有: {sellModal.inventoryItem.quantity}</p>
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
                    quantity: Math.min(prev.inventoryItem?.quantity || 1, prev.quantity + 1)
                  }))}
                  className="w-10 h-10 rounded-full border-3 border-gray-800 font-black text-xl hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price input */}
            <div className="mb-4">
              <label className="font-bold text-gray-700 block mb-2">单价</label>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <input
                  type="number"
                  value={sellModal.price}
                  onChange={(e) => setSellModal((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="flex-1 cartoon-input text-center font-black text-xl"
                  min="1"
                />
              </div>
            </div>

            {/* Fee info */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600">总价:</span>
                <span className="font-black text-blue-600">
                  {(sellModal.price * sellModal.quantity).toLocaleString()} 金币
                </span>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-500">手续费 ({MARKET_FEE_RATE * 100}%):</span>
                <span className="text-red-500 font-bold">
                  -{Math.floor(sellModal.price * sellModal.quantity * MARKET_FEE_RATE)} 金币
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                <span className="font-bold text-gray-600">您将获得:</span>
                <span className="font-black text-green-600">
                  {Math.floor(sellModal.price * sellModal.quantity * (1 - MARKET_FEE_RATE))} 金币
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false })}
                className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleCreateListing}
                disabled={sellModal.loading || sellModal.price <= 0}
                className="cartoon-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sellModal.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Tag className="w-5 h-5" />
                    上架
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
            <h2 className="text-xl font-black text-gray-800 mb-2">成功！</h2>
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