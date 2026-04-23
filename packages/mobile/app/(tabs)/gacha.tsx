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
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { ItemRarity, GachaPoolDefinition } from '@/src/p2p/types';

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

interface GachaResult {
  itemId: string;
  rarity: ItemRarity;
  isPity: boolean;
}

export default function GachaScreen() {
  const { t } = useTranslation();
  const {
    profile,
    gachaPools,
    pullGacha,
    gachaPities,
    isInitialized,
  } = useP2P();

  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [lastResult, setLastResult] = useState<{ items: GachaResult[]; coinsSpent: number } | null>(null);

  const selectedPool = gachaPools[selectedPoolIndex];
  const coinBalance = profile?.coins || 0;

  const getRarityName = (rarity: ItemRarity): string => {
    return t(`rarity.${rarity}`);
  };

  const getPoolRates = (pool: GachaPoolDefinition): Record<ItemRarity, number> => {
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

  const handlePull = async (pullType: 'single' | 'ten') => {
    if (!selectedPool) return;

    const price = pullType === 'single' ? selectedPool.singlePrice : selectedPool.tenPrice;

    if (coinBalance < price) {
      Alert.alert(t('common.error'), t('gacha.insufficientCoins'));
      return;
    }

    setPulling(true);
    try {
      const result = await pullGacha(selectedPool.id, pullType);
      if (result.success) {
        setLastResult({ items: result.items, coinsSpent: result.coinsSpent });
      } else {
        Alert.alert(t('gacha.pullFailed'), result.error || t('gacha.pullError'));
      }
    } catch (error: any) {
      Alert.alert(t('gacha.pullFailed'), error.message || t('gacha.pullError'));
    } finally {
      setPulling(false);
    }
  };

  const pityCount = selectedPool ? gachaPities[selectedPool.id]?.pityCount || 0 : 0;

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const poolRates = selectedPool ? getPoolRates(selectedPool) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('gacha.title')}</Text>
          <View style={styles.currencyContainer}>
            <View style={styles.currencyBadge}>
              <Ionicons name="cash-outline" size={16} color="#D4A017" />
              <Text style={styles.currencyText}>{coinBalance.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {gachaPools.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.poolTabsContainer}
          contentContainerStyle={styles.poolTabsContent}
        >
          {gachaPools.map((pool, index) => (
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
                {pool.nameZh || pool.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedPool && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.poolCard}>
            <Text style={styles.poolName}>{selectedPool.nameZh || selectedPool.name}</Text>
            <Text style={styles.poolDescription}>{selectedPool.description}</Text>
            {pityCount > 0 && (
              <View style={styles.pityRow}>
                <Text style={styles.pityText}>
                  {t('gacha.pityProgress')}: {pityCount}/{selectedPool.pityThreshold}
                </Text>
              </View>
            )}
          </View>

          {poolRates && (
            <View style={styles.ratesCard}>
              <Text style={styles.ratesTitle}>{t('gacha.dropRates')}</Text>
              <View style={styles.ratesGrid}>
                {(['legendary', 'epic', 'rare', 'common'] as ItemRarity[]).map((rarity) => (
                  <View key={rarity} style={styles.rateItem}>
                    <View
                      style={[
                        styles.rateIcon,
                        { backgroundColor: RARITY_BG[rarity] },
                      ]}
                    >
                      <Text style={styles.rateEmoji}>
                        {rarity === 'legendary' ? '👑' : rarity === 'epic' ? '⭐' : rarity === 'rare' ? '💎' : '📦'}
                      </Text>
                    </View>
                    <Text style={styles.rateLabel}>{getRarityName(rarity)}</Text>
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
                  <Text style={styles.pullButtonTitle}>{t('gacha.singlePull')}</Text>
                  <View style={styles.pullButtonPrice}>
                    <Ionicons name="cash-outline" size={14} color="#FFE0A0" />
                    <Text style={styles.pullButtonPriceText}>
                      {selectedPool.singlePrice}
                    </Text>
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
                  <Text style={styles.pullButtonTitle}>{t('gacha.tenPull')}</Text>
                  <View style={styles.pullButtonPrice}>
                    <Ionicons name="cash-outline" size={14} color="#FFE0A0" />
                    <Text style={styles.pullButtonPriceText}>
                      {selectedPool.tenPrice}
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {lastResult && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t('gacha.results')}</Text>
              <View style={styles.resultItems}>
                {lastResult.items.map((result, index) => (
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
                      <Text style={[styles.resultItemRarity, { color: RARITY_COLORS[result.rarity] }]}>
                        {getRarityName(result.rarity)} {result.isPity && `⭐ ${t('gacha.pityTriggered')}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {gachaPools.length === 0 && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="gift-outline" size={48} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>{t('gacha.noPool')}</Text>
          <Text style={styles.emptySubtext}>{t('common.retry')}</Text>
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
  pityRow: {
    marginTop: 8,
  },
  pityText: {
    fontSize: 12,
    color: '#D4A017',
    fontWeight: '600',
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