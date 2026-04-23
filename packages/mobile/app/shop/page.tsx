import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useP2P } from '@/src/p2p/P2PContext';
import { ShopItemDefinition, ItemRarity } from '@/src/p2p/types';
import { RARITY_COLORS, RARITY_BG } from '@/src/p2p/types';

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const RARITY_ICONS: Record<ItemRarity, string> = {
  common: 'star-outline',
  rare: 'star',
  epic: 'star-half',
  legendary: 'star-sharp',
};

const CATEGORY_ICONS: Record<string, string> = {
  '补给': 'medical',
  '道具': 'cube',
  '宝箱': 'gift',
  '礼包': 'gift-outline',
};

export default function ShopScreen() {
  const router = useRouter();
  const {
    profile,
    shopItems,
    purchaseShopItem,
    refreshProfile,
    refreshInventory,
  } = useP2P();

  const [error, setError] = useState('');
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    item: ShopItemDefinition | null;
    quantity: number;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    quantity: 1,
    loading: false,
  });

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: '',
  });

  const coinBalance = profile?.coins ?? 0;

  useFocusEffect(
    useCallback(() => {
    }, [])
  );

  const handlePurchase = async () => {
    if (!purchaseModal.item) return;

    setPurchaseModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await purchaseShopItem(purchaseModal.item.id, purchaseModal.quantity);

      if (result.success) {
        await refreshProfile();
        await refreshInventory();

        setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false });
        setSuccessModal({
          isOpen: true,
          message: `成功购买 ${purchaseModal.quantity} 个 ${purchaseModal.item.nameZh || purchaseModal.item.name}`,
        });
      } else {
        Alert.alert('购买失败', result.error || '购买时出错了');
        setPurchaseModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      Alert.alert('购买失败', '购买时出错了');
      setPurchaseModal((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item: shopItem }: { item: ShopItemDefinition }) => {
    const itemRarity = (shopItem.metadata?.rarity as ItemRarity) || 'common';
    const canAfford = coinBalance >= shopItem.price;
    const isAvailable = shopItem.isAvailable;

    return (
      <TouchableOpacity
        style={[styles.itemCard]}
        onPress={() => {
          if (!isAvailable) {
            Alert.alert('已售罄', '该商品暂不可购买');
            return;
          }
          if (!canAfford) {
            Alert.alert('金币不足', '您没有足够的金币');
            return;
          }
          setPurchaseModal({ isOpen: true, item: shopItem, quantity: 1, loading: false });
        }}
        activeOpacity={0.7}
        disabled={!isAvailable || !canAfford}
      >
        <View style={styles.itemHeader}>
          <View
            style={[
              styles.itemIconContainer,
              { backgroundColor: RARITY_BG[itemRarity] },
            ]}
          >
            <Ionicons
              name={(CATEGORY_ICONS[shopItem.category] || RARITY_ICONS[itemRarity]) as any}
              size={28}
              color={RARITY_COLORS[itemRarity]}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {shopItem.nameZh || shopItem.name}
            </Text>
            <Text style={[styles.itemCategory, { color: RARITY_COLORS[itemRarity] }]}>
              {shopItem.category}
            </Text>
          </View>
        </View>

        <Text style={styles.itemDescription} numberOfLines={2}>
          {shopItem.description}
        </Text>

        <View style={styles.itemFooter}>
          <View style={styles.priceRow}>
            <Ionicons name="logo-usd" size={16} color="#D4A017" />
            <Text style={styles.priceText}>{shopItem.price}</Text>
          </View>
          <Text style={styles.limitText}>
            {shopItem.purchaseLimit > 0 ? `限购 ${shopItem.purchaseLimit}` : '不限购'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.buyButton,
            (!isAvailable || !canAfford) && styles.buyButtonDisabled,
          ]}
          disabled={!isAvailable || !canAfford}
        >
          <Text style={styles.buyButtonText}>
            {!isAvailable ? '已售罄' : !canAfford ? '金币不足' : '购买'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <Ionicons name="cart" size={28} color="#D4A017" />
            <Text style={styles.title}>NPC商店</Text>
          </View>
          <View style={styles.coinBalance}>
            <Ionicons name="logo-usd" size={18} color="#D4A017" />
            <Text style={styles.coinBalanceText}>{coinBalance}</Text>
          </View>
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

      <FlatList
        data={shopItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cube-outline" size={48} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>商店暂无商品</Text>
            <Text style={styles.emptySubtext}>请稍后再来看看</Text>
          </View>
        }
      />

      <Modal
        visible={purchaseModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>确认购买</Text>
              <TouchableOpacity
                onPress={() => setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false })}
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
                      { backgroundColor: RARITY_BG[(purchaseModal.item.metadata?.rarity as ItemRarity) || 'common'] },
                    ]}
                  >
                    <Ionicons
                      name={(CATEGORY_ICONS[purchaseModal.item.category] || 'cube') as any}
                      size={32}
                      color={RARITY_COLORS[(purchaseModal.item.metadata?.rarity as ItemRarity) || 'common']}
                    />
                  </View>
                  <View style={styles.itemPreviewInfo}>
                    <Text style={styles.itemPreviewName}>
                      {purchaseModal.item.nameZh || purchaseModal.item.name}
                    </Text>
                    <Text style={styles.itemPreviewCategory}>{purchaseModal.item.category}</Text>
                  </View>
                </View>

                <View style={styles.quantitySection}>
                  <Text style={styles.quantityLabel}>数量</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setPurchaseModal((prev) => ({
                        ...prev,
                        quantity: Math.max(1, prev.quantity - 1),
                      }))}
                    >
                      <Ionicons name="remove" size={20} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{purchaseModal.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        const max = purchaseModal.item!.purchaseLimit > 0
                          ? purchaseModal.item!.purchaseLimit
                          : 99;
                        setPurchaseModal((prev) => ({
                          ...prev,
                          quantity: Math.min(max, prev.quantity + 1),
                        }));
                      }}
                    >
                      <Ionicons name="add" size={20} color="#1A1A1A" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.totalSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>总价:</Text>
                    <View style={styles.totalPrice}>
                      <Ionicons name="logo-usd" size={20} color="#D4A017" />
                      <Text style={styles.totalValue}>
                        {purchaseModal.item.price * purchaseModal.quantity}
                      </Text>
                    </View>
                  </View>
                  {coinBalance < purchaseModal.item.price * purchaseModal.quantity && (
                    <Text style={styles.insufficientFunds}>金币不足！</Text>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setPurchaseModal({ isOpen: false, item: null, quantity: 1, loading: false })}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      purchaseModal.loading || coinBalance < purchaseModal.item.price * purchaseModal.quantity
                        ? styles.confirmButtonDisabled
                        : undefined,
                    ]}
                    onPress={handlePurchase}
                    disabled={purchaseModal.loading || coinBalance < purchaseModal.item.price * purchaseModal.quantity}
                  >
                    {purchaseModal.loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>确认</Text>
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
            <Text style={styles.successTitle}>购买成功</Text>
            <Text style={styles.successMessage}>{successModal.message}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setSuccessModal({ isOpen: false, message: '' })}
            >
              <Text style={styles.successButtonText}>确认</Text>
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
    marginBottom: 10,
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
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
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
  limitText: {
    fontSize: 11,
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
  },
  quantitySection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E7',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
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
  insufficientFunds: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
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