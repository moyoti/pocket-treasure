import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p';
import { InventoryItem, ItemRarity, RARITY_COLORS } from '@/src/p2p/types';
import { getItemById } from '@/src/p2p/data/items';

const RARITY_BG: Record<ItemRarity, string> = {
  common: '#F1F3F5',
  rare: '#EBF5FF',
  epic: '#F5F0FF',
  legendary: '#FFFBEB',
};

const RARITY_ICONS: Record<ItemRarity, string> = {
  common: 'diamond-outline',
  rare: 'diamond',
  epic: 'star',
  legendary: 'trophy',
};

interface DisplayItem {
  id: string;
  itemDef: {
    id: string;
    name: string;
    nameZh: string;
    rarity: ItemRarity;
  };
  quantity: number;
  poiName?: string;
  collectedAt: number;
  inventoryIds: string[];
}

export default function InventoryScreen() {
  const { t } = useTranslation();
  const { inventory, nearbyPOIs, isLoading, refreshInventory, sellItem, getSellPrice, sellPrices, profile } = useP2P();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [selling, setSelling] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshInventory();
    setRefreshing(false);
  };

  const handleSellPress = (item: DisplayItem) => {
    setSelectedItem(item);
    setSellModalVisible(true);
  };

  const getRarityName = (rarity: ItemRarity): string => {
    return t(`rarity.${rarity}`);
  };

  const handleConfirmSell = async () => {
    if (!selectedItem || selling) return;
    
    setSelling(true);
    try {
      const result = await sellItem(selectedItem.inventoryIds[0]);
      
      if (result.success) {
        Alert.alert(
          t('common.success'),
          `You sold ${result.soldItem?.itemName} for ${result.coinsEarned} ${t('gacha.coins')}!`,
          [{ text: t('common.confirm'), onPress: () => setSellModalVisible(false) }]
        );
        setSelectedItem(null);
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.unableToSell'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('settings.sellFailed'));
    } finally {
      setSelling(false);
    }
  };

  const displayItems: DisplayItem[] = useMemo(() => {
    const grouped: Record<string, DisplayItem> = {};
    
    for (const invItem of inventory) {
      const itemDef = getItemById(invItem.itemId);
      if (!itemDef) continue;
      
      const key = invItem.itemId;
      if (grouped[key]) {
        grouped[key].quantity += invItem.quantity;
        grouped[key].inventoryIds.push(invItem.id);
      } else {
        const poi = nearbyPOIs.find(p => p.id === invItem.sourcePoiId);
        grouped[key] = {
          id: invItem.id,
          itemDef: {
            id: itemDef.id,
            name: itemDef.name,
            nameZh: itemDef.nameZh || '',
            rarity: itemDef.rarity,
          },
          quantity: invItem.quantity,
          poiName: poi?.name,
          collectedAt: invItem.collectedAt,
          inventoryIds: [invItem.id],
        };
      }
    }
    
    return Object.values(grouped).sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.itemDef.rarity] - rarityOrder[b.itemDef.rarity];
    });
  }, [inventory, nearbyPOIs]);

  const stats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = displayItems.length;
    const byRarity: Record<ItemRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    
    for (const item of displayItems) {
      byRarity[item.itemDef.rarity] += item.quantity;
    }
    
    return { totalItems, uniqueItems, byRarity };
  }, [inventory, displayItems]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: DisplayItem }) => {
    const rarity = item.itemDef.rarity;
    const sellPrice = sellPrices[rarity];
    return (
      <TouchableOpacity
        style={[styles.itemCard, { borderLeftColor: RARITY_COLORS[rarity] }]}
        onPress={() => router.push(`/item/${item.itemDef.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.itemIconContainer, { backgroundColor: RARITY_BG[rarity] }]}>
          <Ionicons
            name={RARITY_ICONS[rarity] as any}
            size={24}
            color={RARITY_COLORS[rarity]}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.itemDef.name}</Text>
          <View style={styles.rarityRow}>
            <View style={[styles.rarityBadge, { backgroundColor: RARITY_BG[rarity] }]}>
              <Text style={[styles.rarityText, { color: RARITY_COLORS[rarity] }]}>
                {getRarityName(rarity)}
              </Text>
            </View>
            <Text style={styles.sellPriceText}>{t('inventory.sell')}: {sellPrice} {t('gacha.coins')}</Text>
          </View>
          {item.poiName && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#999" />
              <Text style={styles.itemLocation} numberOfLines={1}>{item.poiName}</Text>
            </View>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
        </View>
        <TouchableOpacity 
          style={styles.sellButton}
          onPress={() => handleSellPress(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="cash-outline" size={18} color="#22C55E" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
<View style={styles.header}>
        <Text style={styles.title}>{t('nav.backpack')}</Text>
        <Text style={styles.subtitle}>{t('inventory.empty')}</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={20} color="#D4A017" />
            <Text style={styles.statValue}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>{t('market.total')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="apps-outline" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.uniqueItems}</Text>
            <Text style={styles.statLabel}>{t('market.unique')}</Text>
          </View>
          {Object.entries(stats.byRarity).map(([rarity, count]) => (
            <View key={rarity} style={styles.statCard}>
              <Ionicons
                name={RARITY_ICONS[rarity as ItemRarity] as any}
                size={20}
                color={RARITY_COLORS[rarity as ItemRarity]}
              />
              <Text style={[styles.statValue, { color: RARITY_COLORS[rarity as ItemRarity] }]}>
                {count}
              </Text>
              <Text style={styles.statLabel}>{getRarityName(rarity as ItemRarity)}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={displayItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A017"
            colors={['#D4A017']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cube-outline" size={48} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>{t('inventory.empty')}</Text>
<Text style={styles.emptySubtext}>{t('inventory.exploreMap')}</Text>
          </View>
        }
      />

      <Modal
        visible={sellModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconContainer, { backgroundColor: RARITY_BG[selectedItem.itemDef.rarity] }]}>
                    <Ionicons
                      name={RARITY_ICONS[selectedItem.itemDef.rarity] as any}
                      size={32}
                      color={RARITY_COLORS[selectedItem.itemDef.rarity]}
                    />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{selectedItem.itemDef.name}</Text>
                    <View style={[styles.modalRarityBadge, { backgroundColor: RARITY_BG[selectedItem.itemDef.rarity] }]}>
                      <Text style={[styles.modalRarityText, { color: RARITY_COLORS[selectedItem.itemDef.rarity] }]}>
                        {getRarityName(selectedItem.itemDef.rarity)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSellModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSellInfo}>
<View style={styles.sellRow}>
                    <Ionicons name="cube-outline" size={20} color="#666" />
                    <Text style={styles.sellLabel}>{t('market.quantity')}:</Text>
                    <Text style={styles.sellValue}>x{selectedItem.quantity}</Text>
                  </View>
                  <View style={styles.sellRow}>
                    <Ionicons name="cash-outline" size={20} color="#22C55E" />
                    <Text style={styles.sellLabel}>{t('inventory.sell')}:</Text>
                    <Text style={[styles.sellValue, { color: '#22C55E' }]}>
                      {sellPrices[selectedItem.itemDef.rarity] * selectedItem.quantity} {t('gacha.coins')}
                    </Text>
                  </View>
                  {profile && (
                    <View style={styles.sellRow}>
                      <Ionicons name="wallet-outline" size={20} color="#D4A017" />
                      <Text style={styles.sellLabel}>{t('shop.price')}:</Text>
                      <Text style={[styles.sellValue, { color: '#D4A017' }]}>{profile.coins}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSellModalVisible(false)}
                  >
                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmSellButton}
                    onPress={handleConfirmSell}
                    disabled={selling}
                  >
                    {selling ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="cash" size={18} color="#FFF" />
                        <Text style={styles.confirmSellText}>{t('inventory.sell')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 4,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  rarityRow: {
    flexDirection: 'row',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  itemLocation: {
    fontSize: 11,
    color: '#999',
  },
  quantityContainer: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  quantityText: {
    color: '#D4A017',
    fontWeight: '700',
    fontSize: 14,
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
  sellPriceText: {
    fontSize: 11,
    color: '#22C55E',
    marginLeft: 8,
    fontWeight: '600',
  },
  sellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FFF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalRarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalSellInfo: {
    marginBottom: 20,
    gap: 12,
  },
  sellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  sellValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  confirmSellButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmSellText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});