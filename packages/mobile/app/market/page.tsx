import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { RARITY_COLORS, RARITY_BG, RARITY_NAMES, RARITY_ICONS } from '@/constants/colors';
import { QuantitySelector } from '@/components/QuantitySelector';
import { CoinBalance as CoinBalanceComponent } from '@/components/CoinBalance';

const MARKET_FEE_RATE = 0.1;

export default function MarketScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | null>(null);

  const [buyModal, setBuyModal] = useState<{
    isOpen: boolean;
    listing: MarketListing | null;
    loading: boolean;
  }>({
    isOpen: false,
    listing: null,
    loading: false,
  });

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

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  const fetchBrowseData = useCallback(async () => {
    try {
      const [listingsData, balanceData] = await Promise.all([
        getMarketListings(),
        getCoinBalance(),
      ]);
      setListings(listingsData);
      setBalance(balanceData);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch market data:', err);
      setError(err.message || '加载市场数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyData = useCallback(async () => {
    try {
      const [myListingsData, inventoryData] = await Promise.all([
        getMyListings(),
        getInventory(),
      ]);
      setMyListings(myListingsData);
      setMyInventory(inventoryData);
    } catch (err: any) {
      console.error('Failed to fetch my listings:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      if (activeTab === 'browse') {
        fetchBrowseData();
      } else {
        fetchMyData();
      }
    }, [activeTab, fetchBrowseData, fetchMyData])
  );

  const handleBuy = async () => {
    if (!buyModal.listing) return;

    setBuyModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await buyMarketListing(buyModal.listing.id);

      setBalance((prev) =>
        prev ? { ...prev, balance: result.newBalance } : null
      );

      setListings((prev) => prev.filter((l) => l.id !== buyModal.listing?.id));

      setBuyModal({ isOpen: false, listing: null, loading: false });
      setSuccessModal({
        isOpen: true,
        message: `成功购买 ${buyModal.listing.item.name}！`,
      });
    } catch (err: any) {
      Alert.alert('购买失败', err.message || '购买时发生错误');
      setBuyModal((prev) => ({ ...prev, loading: false }));
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

      fetchMyData();

      setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false });
      setSuccessModal({
        isOpen: true,
        message: `成功上架 ${sellModal.inventoryItem.item.name}！`,
      });
    } catch (err: any) {
      Alert.alert('上架失败', err.message || '上架时发生错误');
      setSellModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelListing = async (listingId: string) => {
    Alert.alert('确认取消', '确定要取消这个上架吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await cancelMarketListing(listingId);
            setMyListings((prev) => prev.filter((l) => l.id !== listingId));
            setSuccessModal({
              isOpen: true,
              message: '上架已取消！',
            });
          } catch (err: any) {
            Alert.alert('取消失败', err.message || '取消上架时发生错误');
          }
        },
      },
    ]);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = !rarityFilter || listing.item.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const rarities: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];

  const renderListingItem = ({ item: listing, index }: { item: MarketListing; index: number }) => {
    const itemRarity = listing.item.rarity as ItemRarity;
    const canAfford = balance ? balance.balance >= listing.price : false;

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { animationDelay: `${Math.min(index * 50, 300)}ms` },
        ]}
        onPress={() => {
          if (!canAfford) {
            Alert.alert('金币不足', '您需要更多金币才能购买此物品');
            return;
          }
          setBuyModal({ isOpen: true, listing, loading: false });
        }}
        activeOpacity={0.7}
        disabled={!canAfford}
      >
        <View style={styles.itemHeader}>
          <View
            style={[
              styles.itemIconContainer,
              { backgroundColor: RARITY_BG[itemRarity] },
            ]}
          >
            <Ionicons
              name={RARITY_ICONS[itemRarity] as any}
              size={28}
              color={RARITY_COLORS[itemRarity]}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{listing.item.name}</Text>
            <Text style={[styles.itemCategory, { color: RARITY_COLORS[itemRarity] }]}>
              {RARITY_NAMES[itemRarity]}
            </Text>
          </View>
        </View>

        <View style={styles.sellerRow}>
          <Ionicons name="person-outline" size={14} color="#999" />
          <Text style={styles.sellerName} numberOfLines={1}>{listing.seller.username}</Text>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.priceRow}>
            <Ionicons name="logo-usd" size={16} color="#D4A017" />
            <Text style={styles.priceText}>{listing.price.toLocaleString()}</Text>
          </View>
          <Text style={styles.quantityText}>x{listing.quantity}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.buyButton,
            !canAfford && styles.buyButtonDisabled,
          ]}
          disabled={!canAfford}
        >
          <Text style={styles.buyButtonText}>
            {!canAfford ? '金币不足' : '购买'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderMyListingItem = ({ item: listing }: { item: MarketListing }) => {
    const itemRarity = listing.item.rarity as ItemRarity;

    return (
      <View style={styles.myListingCard}>
        <View style={styles.itemHeader}>
          <View
            style={[
              styles.itemIconContainer,
              { backgroundColor: RARITY_BG[itemRarity] },
            ]}
          >
            <Ionicons
              name={RARITY_ICONS[itemRarity] as any}
              size={24}
              color={RARITY_COLORS[itemRarity]}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{listing.item.name}</Text>
            <View style={styles.priceRow}>
              <Ionicons name="logo-usd" size={14} color="#D4A017" />
              <Text style={styles.priceTextSmall}>{listing.price.toLocaleString()}</Text>
              <Text style={styles.quantityTextSmall}> x{listing.quantity}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.cancelButtonSmall}
          onPress={() => handleCancelListing(listing.id)}
        >
          <Text style={styles.cancelButtonTextSmall}>取消</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>加载市场中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <Ionicons name="storefront" size={28} color="#D4A017" />
            <Text style={styles.title}>交易市场</Text>
          </View>
          {balance && <CoinBalanceComponent balance={balance.balance} />}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
            onPress={() => setActiveTab('browse')}
          >
            <Ionicons 
              name={activeTab === 'browse' ? 'trending-up' : 'trending-up-outline'} 
              size={18} 
              color={activeTab === 'browse' ? '#1A1A1A' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
              浏览
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            onPress={() => setActiveTab('my')}
          >
            <Ionicons 
              name={activeTab === 'my' ? 'person' : 'person-outline'} 
              size={18} 
              color={activeTab === 'my' ? '#1A1A1A' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
              我的上架
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Ionicons name="close" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'browse' && (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索物品..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            <TouchableOpacity
              style={[styles.filterPill, !rarityFilter && styles.filterPillActive]}
              onPress={() => setRarityFilter(null)}
            >
              <Text style={[styles.filterText, !rarityFilter && styles.filterTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            {rarities.map((rarity) => (
              <TouchableOpacity
                key={rarity}
                style={[
                  styles.filterPill,
                  rarityFilter === rarity && styles.filterPillActive,
                  { borderColor: RARITY_COLORS[rarity] },
                ]}
                onPress={() => setRarityFilter(rarity)}
              >
                <Text
                  style={[
                    styles.filterText,
                    rarityFilter === rarity && styles.filterTextActive,
                    { color: rarityFilter === rarity ? RARITY_COLORS[rarity] : '#666' },
                  ]}
                >
                  {RARITY_NAMES[rarity]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id}
            renderItem={renderListingItem}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="cube-outline" size={48} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>未找到物品</Text>
                <Text style={styles.emptySubtext}>请调整搜索条件或筛选</Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'my' && (
        <View style={styles.myTabContainer}>
          <TouchableOpacity
            style={styles.createListingButton}
            onPress={() => setSellModal({ isOpen: true, inventoryItem: null, quantity: 1, price: 100, loading: false })}
          >
            <Ionicons name="add-circle" size={24} color="#FFF" />
            <Text style={styles.createListingButtonText}>创建上架</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>我的上架列表</Text>
          {myListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cube-outline" size={48} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>暂无上架物品</Text>
              <Text style={styles.emptySubtext}>从背包中选择物品上架出售</Text>
            </View>
          ) : (
            <FlatList
              data={myListings}
              keyExtractor={(item) => item.id}
              renderItem={renderMyListingItem}
              contentContainerStyle={styles.myListingsList}
            />
          )}
        </View>
      )}

      <Modal
        visible={buyModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBuyModal({ isOpen: false, listing: null, loading: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>确认购买</Text>
              <TouchableOpacity
                onPress={() => setBuyModal({ isOpen: false, listing: null, loading: false })}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {buyModal.listing && (
              <>
                <View style={styles.itemPreview}>
                  <View
                    style={[
                      styles.itemPreviewIcon,
                      { backgroundColor: RARITY_BG[buyModal.listing.item.rarity as ItemRarity] },
                    ]}
                  >
                    <Ionicons
                      name={RARITY_ICONS[buyModal.listing.item.rarity as ItemRarity] as any}
                      size={32}
                      color={RARITY_COLORS[buyModal.listing.item.rarity as ItemRarity]}
                    />
                  </View>
                  <View style={styles.itemPreviewInfo}>
                    <Text style={styles.itemPreviewName}>{buyModal.listing.item.name}</Text>
                    <Text style={styles.itemPreviewCategory}>
                      {RARITY_NAMES[buyModal.listing.item.rarity as ItemRarity]}
                    </Text>
                    <Text style={styles.itemPreviewSeller}>卖家：{buyModal.listing.seller.username}</Text>
                  </View>
                </View>

                <View style={styles.totalSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>价格:</Text>
                    <View style={styles.totalPrice}>
                      <Ionicons name="logo-usd" size={20} color="#D4A017" />
                      <Text style={styles.totalValue}>
                        {buyModal.listing.price.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>数量:</Text>
                    <Text style={styles.totalValueSmall}>x{buyModal.listing.quantity}</Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setBuyModal({ isOpen: false, listing: null, loading: false })}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      buyModal.loading || (balance !== null && balance.balance < buyModal.listing.price)
                        ? styles.confirmButtonDisabled
                        : undefined,
                    ]}
                    onPress={handleBuy}
                    disabled={buyModal.loading || (balance !== null && balance.balance < buyModal.listing.price)}
                  >
                    {buyModal.loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>购买</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={sellModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>创建上架</Text>
              <TouchableOpacity
                onPress={() => setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false })}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>选择物品</Text>
            <FlatList
              data={myInventory.filter((item) => item.quantity > 0)}
              keyExtractor={(item) => item.id}
              nestedScrollEnabled
              style={styles.inventoryList}
              renderItem={({ item: invItem }) => (
                <TouchableOpacity
                  style={[
                    styles.inventoryItem,
                    sellModal.inventoryItem?.id === invItem.id && styles.inventoryItemSelected,
                  ]}
                  onPress={() => setSellModal((prev) => ({ ...prev, inventoryItem: invItem, quantity: 1 }))}
                >
                  <View
                    style={[
                      styles.inventoryItemIcon,
                      { backgroundColor: RARITY_BG[invItem.item.rarity as ItemRarity] },
                    ]}
                  >
                    <Ionicons
                      name={RARITY_ICONS[invItem.item.rarity as ItemRarity] as any}
                      size={20}
                      color={RARITY_COLORS[invItem.item.rarity as ItemRarity]}
                    />
                  </View>
                  <View style={styles.inventoryItemInfo}>
                    <Text style={styles.inventoryItemName}>{invItem.item.name}</Text>
                    <Text style={styles.inventoryItemQty}>拥有：{invItem.quantity}</Text>
                  </View>
                  {sellModal.inventoryItem?.id === invItem.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyInventory}>
                  <Text style={styles.emptyInventoryText}>背包中没有可出售的物品</Text>
                </View>
              }
            />

            {sellModal.inventoryItem && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>数量</Text>
                  <QuantitySelector
                    value={sellModal.quantity}
                    onValueChange={(value) => setSellModal((prev) => ({ ...prev, quantity: value }))}
                    min={1}
                    max={sellModal.inventoryItem.quantity}
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>单价</Text>
                  <View style={styles.priceInputContainer}>
                    <Ionicons name="logo-usd" size={20} color="#D4A017" />
                    <TextInput
                      style={styles.priceInput}
                      value={sellModal.price.toString()}
                      onChangeText={(text) => setSellModal((prev) => ({ ...prev, price: parseInt(text) || 0 }))}
                      keyboardType="numeric"
                      placeholder="输入价格"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.feeSection}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>总价:</Text>
                    <Text style={styles.feeValue}>
                      {(sellModal.price * sellModal.quantity).toLocaleString()} 金币
                    </Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabelSmall}>手续费 ({MARKET_FEE_RATE * 100}%):</Text>
                    <Text style={styles.feeValueSmall}>
                      -{Math.floor(sellModal.price * sellModal.quantity * MARKET_FEE_RATE)} 金币
                    </Text>
                  </View>
                  <View style={[styles.feeRow, styles.feeRowHighlight]}>
                    <Text style={styles.feeLabelHighlight}>您将获得:</Text>
                    <Text style={styles.feeValueHighlight}>
                      {Math.floor(sellModal.price * sellModal.quantity * (1 - MARKET_FEE_RATE))} 金币
                    </Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSellModal({ isOpen: false, inventoryItem: null, quantity: 1, price: 100, loading: false })}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      sellModal.loading || sellModal.price <= 0
                        ? styles.confirmButtonDisabled
                        : undefined,
                    ]}
                    onPress={handleCreateListing}
                    disabled={sellModal.loading || sellModal.price <= 0}
                  >
                    {sellModal.loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>上架</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={successModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal({ isOpen: false, message: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.successModalContent]}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
            </View>
            <Text style={styles.successTitle}>成功！</Text>
            <Text style={styles.successMessage}>{successModal.message}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setSuccessModal({ isOpen: false, message: '' })}
            >
              <Text style={styles.successButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  tabActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D4A017',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  tabTextActive: {
    color: '#1A1A1A',
    fontWeight: '800',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D4A017',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  filterTextActive: {
    fontWeight: '800',
  },
  listContainer: {
    padding: 16,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 11,
    fontWeight: '700',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 12,
    color: '#999',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#F0E8D8',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D4A017',
  },
  priceTextSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4A017',
  },
  quantityText: {
    fontSize: 11,
    color: '#999',
  },
  quantityTextSmall: {
    fontSize: 12,
    color: '#999',
  },
  buyButton: {
    backgroundColor: '#D4A017',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  myTabContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  createListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  createListingButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  myListingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  cancelButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  cancelButtonTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  myListingsList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyInventory: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyInventoryText: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  successModalContent: {
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  inventoryList: {
    maxHeight: 120,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  inventoryItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  inventoryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  inventoryItemInfo: {
    flex: 1,
  },
  inventoryItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  inventoryItemQty: {
    fontSize: 12,
    color: '#999',
  },
  modalSection: {
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingVertical: 10,
  },
  feeSection: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feeRowHighlight: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#FDE68A',
  },
  feeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  feeLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  feeLabelHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  feeValueSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  feeValueHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  itemPreviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  itemPreviewInfo: {
    flex: 1,
  },
  itemPreviewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemPreviewCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPreviewSeller: {
    fontSize: 12,
    color: '#999',
  },
  totalSection: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  totalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D4A017',
  },
  totalValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#333',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D4A017',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
