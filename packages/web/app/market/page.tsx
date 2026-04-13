'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import {
  getMarketListings,
  getMyListings,
  createMarketListing,
  buyMarketListing,
  cancelMarketListing,
  getCoinBalance,
  getInventory,
  getRecentSales,
  getPriceHistory,
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
  ChevronDown,
  Clock,
  History,
} from 'lucide-react';

const RARITY_BG_COLORS: Record<ItemRarity, string> = {
  common: '#E5E7EB',
  rare: '#DBEAFE',
  epic: '#EDE9FE',
  legendary: '#FEF3C7',
};

const MARKET_FEE_RATE = 0.1; // 10%

// Market history types
interface PriceHistoryItem {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volume: number;
}

interface RecentSaleItem {
  id: string;
  itemName: string;
  itemRarity: string;
  unitPrice: number;
  quantity: number;
  soldAt: string;
  sellerName?: string;
}

export default function MarketPage() {
  const { t } = useLocale();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<'market' | 'my' | 'sales'>('market');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'date_asc' | 'date_desc'>('date_desc');

  // Recent sales state
  const [recentSales, setRecentSales] = useState<RecentSaleItem[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Price history modal state
  const [priceHistoryModal, setPriceHistoryModal] = useState<{
    isOpen: boolean;
    item: { name: string; itemId: string } | null;
    history7d: PriceHistoryItem[];
    history30d: PriceHistoryItem[];
    selectedDays: 7 | 30;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    history7d: [],
    history30d: [],
    selectedDays: 7,
    loading: false,
  });

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
        getMarketListings({ sortBy }),
        getCoinBalance(),
      ]);
      setListings(listingsData);
      setBalance(balanceData);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(t('market.loadMarketFailed'));
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  const fetchRecentSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const data = await getRecentSales(50);
      setRecentSales(data);
    } catch (err) {
      console.error('Failed to fetch recent sales:', err);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  const fetchPriceHistory = useCallback(async (itemId: string, itemName: string) => {
    setPriceHistoryModal((prev) => ({ ...prev, loading: true }));
    try {
      const [history7d, history30d] = await Promise.all([
        getPriceHistory(itemId, 7),
        getPriceHistory(itemId, 30),
      ]);
      setPriceHistoryModal((prev) => ({
        ...prev,
        history7d,
        history30d,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to fetch price history:', err);
      setPriceHistoryModal((prev) => ({ ...prev, loading: false }));
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

  useEffect(() => {
    if (activeTab === 'sales' && user) {
      fetchRecentSales();
    }
  }, [activeTab, user, fetchRecentSales]);

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
        message: t('market.purchaseSuccess', { item: purchaseModal.listing.item.name }),
      });
    } catch (err: any) {
      setError(err.message || t('market.purchaseFailed'));
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
        message: t('market.listSuccess', { item: sellModal.inventoryItem.item.name }),
      });
    } catch (err: any) {
      setError(err.message || t('market.listFailed'));
      setSellModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm(t('market.cancelThisListing'))) return;

    try {
      await cancelMarketListing(listingId);
      setMyListings((prev) => prev.filter((l) => l.id !== listingId));
      setSuccessModal({
        isOpen: true,
        message: t('market.listingCanceled'),
      });
    } catch (err: any) {
      setError(err.message || t('market.cancelFailed'));
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
            {t('market.title')}
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
            {t('market.browse')}
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold border-3 border-gray-800 transition ${
              activeTab === 'sales'
                ? 'bg-yellow-400 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            {t('market.recentSales')}
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
            {t('market.myListingsTab')}
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
          {/* Search, Filter and Sort */}
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('market.searchPlaceholder')}
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-3 px-4 rounded-xl border-3 border-gray-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
                style={{ appearance: 'none', backgroundImage: 'none', paddingRight: '2.5rem' }}
              >
                <option value="date_desc">{t('market.sortNewest')}</option>
                <option value="date_asc">{t('market.sortOldest')}</option>
                <option value="price_asc">{t('market.sortPriceLow')}</option>
                <option value="price_desc">{t('market.sortPriceHigh')}</option>
              </select>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Filter options */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white rounded-xl border-3 border-gray-800">
                <p className="font-bold text-gray-700 mb-2">{t('market.filterByRarity')}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRarityFilter('')}
                    className={`px-4 py-2 rounded-full font-bold border-2 transition ${
                      rarityFilter === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t('market.all')}
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
                      {t(`inventory.rarity.${rarity}`)}
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
                <p className="text-xl font-bold text-gray-600">{t('market.noItemsFound')}</p>
                <p className="text-gray-500 mt-2">{t('market.adjustSearchOrFilter')}</p>
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-gray-800 truncate flex-1">{listing.item.name}</h3>
                          <button
                            onClick={() => {
                              setPriceHistoryModal(prev => ({ ...prev, isOpen: true, item: { name: listing.item.name, itemId: listing.itemId } }));
                              fetchPriceHistory(listing.itemId, listing.item.name);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition flex-shrink-0"
                            title={t('market.viewPriceHistory')}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                        <p
                          className="text-sm font-bold"
                          style={{ color: RARITY_COLORS[listing.item.rarity as ItemRarity] }}
                        >
                          {t(`inventory.rarity.${listing.item.rarity}`)}
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
                      {balance !== null && balance.balance < listing.price ? t('market.insufficientCoins') : t('market.buy')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'sales' && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-black text-gray-800">{t('market.recentSalesTitle')}</h2>
          </div>
          
          {loadingSales ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-500 font-bold">{t('market.loadingSales')}</p>
            </div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-16 cartoon-card">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                <Clock size={48} className="text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-600">{t('market.noSalesYet')}</p>
              <p className="text-gray-500 mt-2">{t('market.salesWillAppearHere')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale, index) => (
                <div
                  key={sale.id}
                  className="cartoon-card p-4 flex items-center justify-between animate-slide-in-up"
                  style={{ animationDelay: `${Math.min(index * 30, 200)}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-gray-800"
                      style={{ backgroundColor: RARITY_COLORS[sale.itemRarity as ItemRarity] + '20' }}
                    >
                      <TreasureIcon size={24} rarity={sale.itemRarity as ItemRarity} />
                    </div>
                    <div>
                      <p className="font-black text-gray-800">{sale.itemName}</p>
                      <p className="text-sm text-gray-500">{t('market.soldQuantity', { quantity: sale.quantity })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-black text-yellow-600">{sale.unitPrice.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-400">{t('market.unitPrice')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-600">
                        {new Date(sale.soldAt).toLocaleDateString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-gray-400">{t('market.saleTime')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my' && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Create listing button */}
          <div className="mb-6">
            <h2 className="text-lg font-black text-gray-800 mb-4">{t('market.sellItems')}</h2>
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
                    {t('market.sell')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* My listings */}
          <div>
            <h2 className="text-lg font-black text-gray-800 mb-4">{t('market.myListings')}</h2>
            {myListings.length === 0 ? (
              <div className="text-center py-12 cartoon-card">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                  <Package size={40} className="text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-bold">{t('market.myListingsEmpty')}</p>
                <p className="text-gray-500 mt-2">{t('market.listItemsFromInventory')}</p>
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
                      {t('market.cancel')}
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
              <h2 className="text-xl font-black text-gray-800">{t('market.confirmPurchase')}</h2>
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
                <p className="text-sm text-gray-500">{t('market.seller')}: {purchaseModal.listing.seller.username}</p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 mb-4 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-600">{t('market.price')}:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-xl font-black text-yellow-600">
                    {purchaseModal.listing.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{t('market.quantity')}:</span>
                <span>x{purchaseModal.listing.quantity}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPurchaseModal({ isOpen: false, listing: null, loading: false })}
                className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100"
              >
                {t('market.cancel')}
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
                    {t('market.buy')}
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
              <h2 className="text-xl font-black text-gray-800">{t('market.createListing')}</h2>
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
                <p className="text-sm text-gray-500">{t('market.quantity')}: {sellModal.inventoryItem.quantity}</p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mb-4">
              <label className="font-bold text-gray-700 block mb-2">{t('market.quantity')}</label>
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
              <label className="font-bold text-gray-700 block mb-2">{t('market.unitPrice')}</label>
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
                <span className="font-bold text-gray-600">{t('market.totalPrice')}</span>
                <span className="font-black text-blue-600">
                  {(sellModal.price * sellModal.quantity).toLocaleString()} {t('market.price')}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-500">{t('market.fee', { rate: MARKET_FEE_RATE * 100 })}</span>
                <span className="text-red-500 font-bold">
                  -{Math.floor(sellModal.price * sellModal.quantity * MARKET_FEE_RATE)} {t('market.price')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                <span className="font-bold text-gray-600">{t('market.youWillReceive')}</span>
                <span className="font-black text-green-600">
                  {Math.floor(sellModal.price * sellModal.quantity * (1 - MARKET_FEE_RATE))} {t('market.price')}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false })}
                className="flex-1 py-3 rounded-xl border-3 border-gray-800 font-bold hover:bg-gray-100"
              >
                {t('market.cancel')}
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
                    {t('market.listForSale')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {priceHistoryModal.isOpen && priceHistoryModal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="cartoon-card p-6 max-w-lg w-full animate-bounce-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                {priceHistoryModal.item.name} - {t('market.priceHistory')}
              </h2>
              <button
                onClick={() => setPriceHistoryModal({ ...priceHistoryModal, isOpen: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Time range selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPriceHistoryModal(prev => ({ ...prev, selectedDays: 7 }))}
                className={`flex-1 py-2 px-4 rounded-xl font-bold border-3 border-gray-800 transition ${
                  priceHistoryModal.selectedDays === 7
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('market.last7Days')}
              </button>
              <button
                onClick={() => setPriceHistoryModal(prev => ({ ...prev, selectedDays: 30 }))}
                className={`flex-1 py-2 px-4 rounded-xl font-bold border-3 border-gray-800 transition ${
                  priceHistoryModal.selectedDays === 30
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('market.last30Days')}
              </button>
            </div>

            {/* Loading state */}
            {priceHistoryModal.loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
                <p className="text-gray-500 font-bold">{t('market.loadingPriceHistory')}</p>
              </div>
            ) : (
              <>
                {/* Price chart */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border-2 border-gray-200">
                  <div className="h-48 flex items-end justify-between gap-1">
                    {(priceHistoryModal.selectedDays === 7 ? priceHistoryModal.history7d : priceHistoryModal.history30d).map((point, index) => {
                      const history = priceHistoryModal.selectedDays === 7 ? priceHistoryModal.history7d : priceHistoryModal.history30d;
                      const maxPrice = Math.max(...history.map(h => h.avgPrice));
                      const minPrice = Math.min(...history.map(h => h.avgPrice));
                      const heightPercent = maxPrice > 0 ? ((point.avgPrice - minPrice) / (maxPrice - minPrice || 1)) * 100 : 0;
                      
                      return (
                        <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div
                            className="w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded-t transition-all hover:from-blue-500 hover:to-blue-400"
                            style={{ height: `${Math.max(heightPercent, 10)}%` }}
                          />
                          <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                            ¥{point.avgPrice.toLocaleString()}
                          </div>
                          <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
                            {new Date(point.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(() => {
                    const history = priceHistoryModal.selectedDays === 7 ? priceHistoryModal.history7d : priceHistoryModal.history30d;
                    if (history.length === 0) return null;
                    const latest = history[history.length - 1];
                    const oldest = history[0];
                    const priceChange = latest.avgPrice - oldest.avgPrice;
                    const priceChangePercent = oldest.avgPrice > 0 ? (priceChange / oldest.avgPrice) * 100 : 0;
                    
                    return (
                      <>
                        <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200 text-center">
                          <p className="text-xs text-gray-500 mb-1">{t('market.currentAvgPrice')}</p>
                          <p className="font-black text-gray-800">{latest.avgPrice.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200 text-center">
                          <p className="text-xs text-gray-500 mb-1">{t('market.lowestPrice')}</p>
                          <p className="font-black text-green-600">{Math.min(...history.map(h => h.minPrice)).toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200 text-center">
                          <p className="text-xs text-gray-500 mb-1">{t('market.highestPrice')}</p>
                          <p className="font-black text-red-600">{Math.max(...history.map(h => h.maxPrice)).toLocaleString()}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Trend indicator */}
                {(() => {
                  const history = priceHistoryModal.selectedDays === 7 ? priceHistoryModal.history7d : priceHistoryModal.history30d;
                  if (history.length === 0) return null;
                  const latest = history[history.length - 1];
                  const oldest = history[0];
                  const priceChange = latest.avgPrice - oldest.avgPrice;
                  const priceChangePercent = oldest.avgPrice > 0 ? (priceChange / oldest.avgPrice) * 100 : 0;
                  
                  return (
                    <div className={`rounded-xl p-4 border-2 text-center ${
                      priceChange >= 0 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className={`w-5 h-5 ${priceChange >= 0 ? 'text-red-500' : 'text-green-500 transform rotate-180'}`} />
                        <span className={`font-black text-lg ${priceChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {priceChange >= 0 ? t('market.priceChangeUp') : t('market.priceChangeDown')} {Math.abs(priceChangePercent).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('market.comparedToDaysAgo', { days: priceHistoryModal.selectedDays })}{priceChange >= 0 ? t('market.priceChangeUp') : t('market.priceChangeDown')}{Math.abs(priceChange).toLocaleString()}{t('market.price')}
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
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
            <h2 className="text-xl font-black text-gray-800 mb-2">{t('market.success')}</h2>
            <p className="text-gray-600 mb-4">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ isOpen: false, message: '' })}
              className="cartoon-btn w-full"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}