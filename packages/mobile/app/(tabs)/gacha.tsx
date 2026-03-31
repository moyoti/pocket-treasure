import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getGachaPools, pullGacha, getCoinBalance, getGemBalance } from '@/lib/api';
import { GachaPool, GachaPullResponse, ItemRarity } from '@/types';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#8D99AE',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#F59E0B',
};

const RARITY_BG: Record<ItemRarity, string> = {
  common: '#F1F3F5',
  rare: '#EBF5FF',
  epic: '#F5F0FF',
  legendary: '#FFFBEB',
};

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export default function GachaScreen() {
  const router = useRouter();
  const [pools, setPools] = useState<GachaPool[]>([]);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<'coins' | 'gems'>('coins');
  const [coinBalance, setCoinBalance] = useState(0);
  const [gemBalance, setGemBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [lastResult, setLastResult] = useState<GachaPullResponse | null>(null);

  const selectedPool = pools[selectedPoolIndex];

  const isPremiumPool = (pool: GachaPool): boolean => {
    const hasPremiumItems = pool.items.some(
      (item) => item.rarity === 'legendary' || item.rarity === 'epic'
    );
    const highPrice = pool.singlePrice > 5000;
    return hasPremiumItems || highPrice;
  };

  const getPoolRates = (pool: GachaPool): Record<ItemRarity, number> => {
    const totalWeight = pool.items.reduce((sum, item) => sum + item.weight, 0);
    const rates: Record<ItemRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    pool.items.forEach((item) => {
      rates[item.rarity] += Math.round((item.weight / totalWeight) * 100);
    });

    return rates;
  };

  const getGemPrice = (coinPrice: number): number => {
    return Math.ceil(coinPrice / 10);
  };

  const fetchData = useCallback(async () => {
    try {
      const [poolsData, coinData, gemData] = await Promise.all([
        getGachaPools(),
        getCoinBalance(),
        getGemBalance(),
      ]);
      setPools(poolsData.pools || []);
      setCoinBalance(coinData.balance || 0);
      setGemBalance(gemData.balance || 0);
    } catch (error) {
      console.error('Failed to fetch gacha data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handlePull = async (pullType: 'single' | 'ten') => {
    if (!selectedPool) return;

    const coinPrice = pullType === 'single' ? selectedPool.singlePrice : selectedPool.tenPrice;
    // For premium pools, use backend-provided gemPrice/tenGemPrice
    // For standard pools, calculate gem price based on coin price
    const gemPrice = selectedPool.isPremium
      ? (pullType === 'single' ? selectedPool.gemPrice : selectedPool.tenGemPrice)
      : getGemPrice(coinPrice);

    if (selectedCurrency === 'coins') {
      if (coinBalance < coinPrice) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough coins for this pull.');
        return;
      }
    } else {
      if (gemBalance < gemPrice) {
        Alert.alert(
          'Insufficient Gems',
          'You don\'t have enough gems for this pull.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Get Gems', onPress: () => router.push('/recharge' as any) },
          ]
        );
        return;
      }
    }

    setPulling(true);
    try {
      const result = await pullGacha({
        poolId: selectedPool.id,
        pullType,
        currency: selectedCurrency,
      });
      setLastResult(result);
      const [coinData, gemData] = await Promise.all([getCoinBalance(), getGemBalance()]);
      setCoinBalance(coinData.balance || 0);
      setGemBalance(gemData.balance || 0);
    } catch (error: any) {
      Alert.alert('Pull Failed', error.message || 'Failed to perform gacha pull');
    } finally {
      setPulling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>Loading gacha...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const poolRates = selectedPool ? getPoolRates(selectedPool) : null;
  const poolIsPremium = selectedPool ? isPremiumPool(selectedPool) : false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Gacha</Text>
          <View style={styles.currencyContainer}>
            <View style={styles.currencyBadge}>
              <Ionicons name="cash-outline" size={16} color="#D4A017" />
              <Text style={styles.currencyText}>{coinBalance.toLocaleString()}</Text>
            </View>
            <View style={styles.currencyBadge}>
              <Ionicons name="diamond-outline" size={16} color="#9B59B6" />
              <Text style={styles.currencyText}>{gemBalance.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {pools.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.poolTabsContainer}
          contentContainerStyle={styles.poolTabsContent}
        >
          {pools.map((pool, index) => (
            <TouchableOpacity
              key={pool.id}
              style={[
                styles.poolTab,
                selectedPoolIndex === index && styles.poolTabActive,
              ]}
              onPress={() => {
                setSelectedPoolIndex(index);
                setLastResult(null);
              }}
            >
              <Text
                style={[
                  styles.poolTabText,
                  selectedPoolIndex === index && styles.poolTabTextActive,
                ]}
              >
                {pool.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedPool && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.poolCard}>
            <Text style={styles.poolName}>{selectedPool.name}</Text>
            <Text style={styles.poolDescription}>{selectedPool.description}</Text>
          </View>

          {poolIsPremium && (
            <View style={styles.currencySelector}>
              <TouchableOpacity
                style={[
                  styles.currencyTab,
                  selectedCurrency === 'coins' && styles.currencyTabActive,
                ]}
                onPress={() => setSelectedCurrency('coins')}
              >
                <Ionicons name="cash-outline" size={18} color={selectedCurrency === 'coins' ? '#D4A017' : '#AAA'} />
                <Text style={[
                  styles.currencyTabText,
                  selectedCurrency === 'coins' && styles.currencyTabTextActive,
                ]}>
                  {selectedPool.singlePrice} Coins
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.currencyTab,
                  selectedCurrency === 'gems' && styles.currencyTabActive,
                ]}
                onPress={() => setSelectedCurrency('gems')}
              >
                <Ionicons name="diamond-outline" size={18} color={selectedCurrency === 'gems' ? '#9B59B6' : '#AAA'} />
                <Text style={[
                  styles.currencyTabText,
                  selectedCurrency === 'gems' && styles.currencyTabTextActive,
                ]}>
                  {getGemPrice(selectedPool.singlePrice)} Gems
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {poolRates && (
            <View style={styles.ratesCard}>
              <Text style={styles.ratesTitle}>Drop Rates</Text>
              <View style={styles.ratesGrid}>
                {(['legendary', 'epic', 'rare', 'common'] as ItemRarity[]).map((rarity) => (
                  <View key={rarity} style={styles.rateItem}>
                    <View
                      style={[
                        styles.rateIcon,
                        { backgroundColor: RARITY_BG[rarity] },
                      ]}
                    >
                      <Text style={[styles.rateEmoji]}>
                        {rarity === 'legendary' ? '👑' : rarity === 'epic' ? '⭐' : rarity === 'rare' ? '💎' : '📦'}
                      </Text>
                    </View>
                    <Text style={styles.rateLabel}>{RARITY_NAMES[rarity]}</Text>
                    <Text style={[styles.rateValue, { color: RARITY_COLORS[rarity] }]}>
                      {poolRates[rarity]}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.pullButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.pullButton,
                styles.singlePullButton,
                pulling && styles.pullButtonDisabled,
              ]}
              onPress={() => handlePull('single')}
              disabled={pulling}
            >
              {pulling ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.pullButtonTitle}>Single Pull</Text>
                  <View style={styles.pullButtonPrice}>
                    {poolIsPremium && selectedCurrency === 'gems' ? (
                      <>
                        <Ionicons name="diamond-outline" size={14} color="#E0B0FF" />
                        <Text style={styles.pullButtonPriceText}>
                          {getGemPrice(selectedPool.singlePrice)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="cash-outline" size={14} color="#FFE0A0" />
                        <Text style={styles.pullButtonPriceText}>
                          {selectedPool.singlePrice}
                        </Text>
                      </>
                    )}
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pullButton,
                styles.tenPullButton,
                pulling && styles.pullButtonDisabled,
              ]}
              onPress={() => handlePull('ten')}
              disabled={pulling}
            >
              {pulling ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.pullButtonTitle}>10x Pull</Text>
                  <View style={styles.pullButtonPrice}>
                    {poolIsPremium && selectedCurrency === 'gems' ? (
                      <>
                        <Ionicons name="diamond-outline" size={14} color="#E0B0FF" />
                        <Text style={styles.pullButtonPriceText}>
                          {getGemPrice(selectedPool.tenPrice)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="cash-outline" size={14} color="#FFE0A0" />
                        <Text style={styles.pullButtonPriceText}>
                          {selectedPool.tenPrice}
                        </Text>
                      </>
                    )}
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {lastResult && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Latest Pull Results</Text>
              <View style={styles.resultItems}>
                {lastResult.results.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.resultItem,
                      { borderLeftColor: RARITY_COLORS[result.rarity] },
                    ]}
                  >
                    <View style={[styles.resultItemIcon, { backgroundColor: RARITY_BG[result.rarity] }]}>
                      <Text style={styles.resultItemEmoji}>
                        {result.rarity === 'legendary' ? '👑' : result.rarity === 'epic' ? '⭐' : result.rarity === 'rare' ? '💎' : '📦'}
                      </Text>
                    </View>
                    <View style={styles.resultItemInfo}>
                      <Text style={styles.resultItemName}>{result.item.name}</Text>
                      <Text style={[styles.resultItemRarity, { color: RARITY_COLORS[result.rarity] }]}>
                        {RARITY_NAMES[result.rarity]} {result.isPity && '⭐ PITY!'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {pools.length === 0 && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="gift-outline" size={48} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>No gacha pools available</Text>
          <Text style={styles.emptySubtext}>Check back later for new content!</Text>
        </View>
      )}
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 4,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  poolTabsContainer: {
    maxHeight: 50,
  },
  poolTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  poolTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5F0E5',
  },
  poolTabActive: {
    backgroundColor: '#D4A017',
  },
  poolTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  poolTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  poolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  poolName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  poolDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  currencySelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  currencyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  currencyTabActive: {
    backgroundColor: '#FFF8E7',
  },
  currencyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
  },
  currencyTabTextActive: {
    color: '#1A1A1A',
  },
  ratesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  ratesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  ratesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateItem: {
    alignItems: 'center',
    flex: 1,
  },
  rateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateEmoji: {
    fontSize: 20,
  },
  rateLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  pullButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pullButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  singlePullButton: {
    backgroundColor: '#D4A017',
  },
  tenPullButton: {
    backgroundColor: '#9B59B6',
  },
  pullButtonDisabled: {
    opacity: 0.6,
  },
  pullButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  pullButtonPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pullButtonPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  resultItems: {
    gap: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FAFAF5',
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  resultItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultItemEmoji: {
    fontSize: 18,
  },
  resultItemInfo: {
    flex: 1,
  },
  resultItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  resultItemRarity: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
});