import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { COSMETIC_DEFINITIONS } from '@/src/p2p/data';
import { CosmeticDefinition, CosmeticType, ItemRarity } from '@/src/p2p/types';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

const RARITY_BG: Record<ItemRarity, string> = {
  common: '#F3F4F6',
  rare: '#EBF5FF',
  epic: '#F5F0FF',
  legendary: '#FFFBEB',
};

type FilterTab = 'all' | CosmeticType;

const COSMETIC_ICONS: Record<CosmeticType, string> = {
  avatar_frame: 'person-circle',
  badge: 'medal',
  map_skin: 'map',
  sticker: 'chatbubble',
  title: 'text',
  profile_background: 'image',
};

interface PurchaseModalState {
  isOpen: boolean;
  item: CosmeticDefinition | null;
  loading: boolean;
}

export default function CosmeticsScreen() {
  const { t } = useTranslation();
  const {
    profile,
    userCosmetics,
    purchaseCosmetic,
    equipCosmetic,
    unequipCosmetic,
    refreshProfile,
  } = useP2P();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [purchaseModal, setPurchaseModal] = useState<PurchaseModalState>({
    isOpen: false,
    item: null,
    loading: false,
  });

  const getFilterTabs = useCallback((): { key: FilterTab; label: string; icon: string }[] => [
    { key: 'all', label: t('cosmetics.all'), icon: 'grid-outline' },
    { key: 'avatar_frame', label: t('cosmetics.avatarFrame'), icon: 'person-circle-outline' },
    { key: 'badge', label: t('cosmetics.badge'), icon: 'medal-outline' },
    { key: 'map_skin', label: t('cosmetics.mapSkin'), icon: 'map-outline' },
  ], [t]);

  const ownedIds = useMemo(() => {
    const set = new Set<string>();
    userCosmetics.forEach((uc) => set.add(uc.cosmeticId));
    return set;
  }, [userCosmetics]);

  const equippedIds = useMemo(() => {
    const set = new Set<string>();
    userCosmetics.filter((uc) => uc.isEquipped).forEach((uc) => set.add(uc.cosmeticId));
    return set;
  }, [userCosmetics]);

  const cosmetics = useMemo(() => COSMETIC_DEFINITIONS.filter((c) => c.isActive), []);

  const coinBalance = profile?.coins ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      // Refresh profile data when tab is focused to ensure coin balance and cosmetics are up-to-date
      refreshProfile();
    }, [refreshProfile])
  );

  const handleCosmeticPress = (item: CosmeticDefinition) => {
    const isOwned = ownedIds.has(item.id);
    const isEquipped = equippedIds.has(item.id);

    if (isOwned) {
      if (isEquipped) {
        Alert.alert(
          item.name,
          t('cosmetics.equipped'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('cosmetics.unequipTitle'), onPress: () => handleUnequip(item) },
          ]
        );
      } else {
        Alert.alert(
          item.name,
          t('cosmetics.unequipConfirm'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('cosmetics.purchase'), onPress: () => handleEquip(item) },
          ]
        );
      }
    } else {
      setPurchaseModal({ isOpen: true, item, loading: false });
    }
  };

  const handlePurchase = async () => {
    if (!purchaseModal.item) return;

    const item = purchaseModal.item;
    const canAfford = coinBalance >= item.price;

    if (!canAfford) {
      Alert.alert(t('shop.insufficientCoins'), t('cosmetics.insufficientCoins', { price: item.price }));
      setPurchaseModal({ isOpen: false, item: null, loading: false });
      return;
    }

    Alert.alert(
      t('common.confirm'),
      t('shop.buySuccessDetail', { quantity: 1, name: item.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('cosmetics.purchase'),
          onPress: async () => {
            setPurchaseModal((prev) => ({ ...prev, loading: true }));
            try {
              const result = await purchaseCosmetic(item.id);
              if (result.success) {
                setPurchaseModal({ isOpen: false, item: null, loading: false });
                Alert.alert(t('common.success'), t('cosmetics.purchaseSuccess', { name: item.name }));
              } else {
                Alert.alert(t('cosmetics.purchaseFailed'), result.error || t('common.error'));
                setPurchaseModal((prev) => ({ ...prev, loading: false }));
              }
            } catch (error) {
              Alert.alert(t('cosmetics.purchaseFailed'), t('common.error'));
              setPurchaseModal((prev) => ({ ...prev, loading: false }));
            }
          },
        },
      ]
    );
  };

  const handleEquip = async (item: CosmeticDefinition) => {
    try {
      const result = await equipCosmetic(item.id);
      if (result.success) {
        Alert.alert(t('common.success'), t('cosmetics.equipSuccess', { name: item.name }));
      } else {
        Alert.alert(t('cosmetics.equipFailed'), result.error || t('common.error'));
      }
    } catch (error) {
      Alert.alert(t('cosmetics.equipFailed'), t('common.error'));
    }
  };

  const handleUnequip = async (item: CosmeticDefinition) => {
    const result = await unequipCosmetic(item.type);
    if (result.success) {
      Alert.alert(t('common.success'), t('cosmetics.unequipSuccess', { name: item.name }));
    } else {
      Alert.alert(t('common.error'), result.error || t('cosmetics.unequipFailed'));
    }
  };

  const filteredCosmetics = activeFilter === 'all'
    ? cosmetics
    : cosmetics.filter((c) => c.type === activeFilter);

  const getRarityName = (rarity: ItemRarity): string => {
    return t(`rarity.${rarity}`);
  };

  const renderCosmeticCard = ({ item }: { item: CosmeticDefinition }) => {
    const isOwned = ownedIds.has(item.id);
    const isEquipped = equippedIds.has(item.id);
    const iconName = COSMETIC_ICONS[item.type] || 'diamond';

    return (
      <TouchableOpacity
        style={[
          styles.cosmeticCard,
          isEquipped && styles.cosmeticCardEquipped,
        ]}
        onPress={() => handleCosmeticPress(item)}
        activeOpacity={0.7}
      >
        {isEquipped && (
          <View style={[styles.badge, styles.equippedBadge]}>
            <Text style={styles.badgeText}>{t('cosmetics.equipped')}</Text>
          </View>
        )}
        {isOwned && !isEquipped && (
          <View style={[styles.badge, styles.ownedBadge]}>
            <Text style={styles.badgeText}>{t('cosmetics.owned')}</Text>
          </View>
        )}

        <View style={[styles.iconContainer, { backgroundColor: RARITY_BG[item.rarity] }]}>
          <Ionicons
            name={iconName as any}
            size={32}
            color={RARITY_COLORS[item.rarity]}
          />
        </View>

        <Text style={styles.cosmeticName} numberOfLines={1}>
          {item.name}
        </Text>

        {!isOwned ? (
          <View style={styles.priceContainer}>
            <Ionicons name="logo-usd" size={14} color="#D4A017" />
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        ) : (
          <View style={[styles.priceContainer, styles.ownedPriceContainer]}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text style={[styles.priceText, { color: '#16A34A' }]}>
              {isEquipped ? t('cosmetics.equipped') : t('cosmetics.owned')}
            </Text>
          </View>
        )}

        <View style={[styles.rarityIndicator, { backgroundColor: RARITY_COLORS[item.rarity] }]} />
      </TouchableOpacity>
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={28} color="#D4A017" />
            <Text style={styles.title}>{t('cosmetics.title')}</Text>
          </View>
          <View style={styles.coinBalance}>
            <Ionicons name="logo-usd" size={18} color="#D4A017" />
            <Text style={styles.coinBalanceText}>{coinBalance}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {getFilterTabs().map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                activeFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeFilter === tab.key ? '#D4A017' : '#888'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCosmetics}
        keyExtractor={(item) => item.id}
        renderItem={renderCosmeticCard}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A017"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cube-outline" size={48} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>{t('cosmetics.noCosmetics')}</Text>
            <Text style={styles.emptySubtext}>{t('cosmetics.comingSoon')}</Text>
          </View>
        }
      />

      <Modal
        visible={purchaseModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModal({ isOpen: false, item: null, loading: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cosmetics.purchaseTitle')}</Text>
              <TouchableOpacity
                onPress={() => setPurchaseModal({ isOpen: false, item: null, loading: false })}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {purchaseModal.item && (
              <>
                <View style={styles.itemPreview}>
                  <View
                    style={[
                      styles.itemPreviewIcon,
                      { backgroundColor: RARITY_BG[purchaseModal.item.rarity] },
                    ]}
                  >
                    <Ionicons
                      name={(COSMETIC_ICONS[purchaseModal.item.type] || 'diamond') as any}
                      size={32}
                      color={RARITY_COLORS[purchaseModal.item.rarity]}
                    />
                  </View>
                  <View style={styles.itemPreviewInfo}>
                    <Text style={styles.itemPreviewName}>
                      {purchaseModal.item.name}
                    </Text>
                    <Text style={styles.itemPreviewDescription}>
                      {purchaseModal.item.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceSection}>
                  <Text style={styles.priceSectionLabel}>{t('cosmetics.price')}</Text>
                  <View style={styles.priceRow}>
                    <Ionicons name="logo-usd" size={20} color="#D4A017" />
                    <Text style={styles.modalPriceText}>{purchaseModal.item.price}</Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setPurchaseModal({ isOpen: false, item: null, loading: false })}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      coinBalance < purchaseModal.item.price && styles.confirmButtonDisabled,
                    ]}
                    onPress={handlePurchase}
                    disabled={coinBalance < purchaseModal.item.price}
                  >
                    {purchaseModal.loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>{t('cosmetics.purchase')}</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {coinBalance < purchaseModal.item.price && (
                  <Text style={styles.insufficientText}>
                    {t('cosmetics.insufficientCoins', { price: purchaseModal.item.price })}
                  </Text>
                )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  coinBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    gap: 6,
  },
  coinBalanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4A017',
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F0E5',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFF8E7',
    borderWidth: 2,
    borderColor: '#D4A017',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  filterTabTextActive: {
    color: '#D4A017',
  },
  gridContent: {
    padding: 16,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  cosmeticCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cosmeticCardEquipped: {
    borderColor: '#D4A017',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  ownedBadge: {
    backgroundColor: '#16A34A',
  },
  equippedBadge: {
    backgroundColor: '#D4A017',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  cosmeticName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownedPriceContainer: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4A017',
  },
  rarityIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
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
  itemPreviewDescription: {
    fontSize: 12,
    color: '#666',
  },
  priceSection: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  priceSectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalPriceText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4A017',
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
  insufficientText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
});