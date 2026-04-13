import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getGemBalance, getRechargePackages } from '../../lib/api';
import { initIAP, getProducts, purchaseProduct, finishTransaction } from '../../src/lib/iap';
import type { Purchase } from 'react-native-iap';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RechargePackage {
  id: string;
  name: string;
  price: number;
  gemsAmount: number;
  bonusGems: number;
  isFirstRechargeBonus: boolean;
  sortOrder: number;
}

export default function RechargeScreen() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [gemBalance, setGemBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [balanceData, packagesData] = await Promise.all([
        getGemBalance(),
        getRechargePackages(),
      ]);
      setGemBalance(balanceData.balance);
      setPackages(packagesData);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    initIAP().then(() => {
      loadProducts();
    });
  }, []);

  const loadProducts = async () => {
    try {
      await getProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  async function verifyPurchaseWithBackend(purchase: Purchase) {
    const response = await fetch(`${API_BASE}/recharge/iap/apple/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: `IAP_${purchase.transactionId}`,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        purchaseDate: purchase.transactionDate,
      }),
    });
    return response.json();
  }

  const handleIAPPurchase = async (productId: string) => {
    try {
      // 1. 发起购买
      const purchase = await purchaseProduct(productId);
      if (!purchase) return;

      // 2. 调用后端验证
      const result = await verifyPurchaseWithBackend(purchase);

      // 3. 结束交易
      await finishTransaction(purchase);

      // 4. 更新UI
      if (result.success) {
        const balanceData = await getGemBalance();
        setGemBalance(balanceData.balance);
        Alert.alert(t('recharge.rechargeSuccess'), t('recharge.purchaseComplete'));
      }
    } catch (error) {
      Alert.alert(t('recharge.rechargeFailed'), t('recharge.tryAgainLater'));
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchase = async (pkg: RechargePackage) => {
    try {
      setPurchasing(pkg.id);
      const productId = getProductIdForPackage(pkg);
      await handleIAPPurchase(productId);
    } catch (error) {
      Alert.alert(t('recharge.rechargeFailed'), t('recharge.tryAgainLater'));
    }
  };

  const getProductIdForPackage = (pkg: RechargePackage): string => {
    if (pkg.gemsAmount <= 100) return Platform.OS === 'ios' ? 'com.treasurehunt.gems.small' : 'gem_pack_small';
    if (pkg.gemsAmount <= 500) return Platform.OS === 'ios' ? 'com.treasurehunt.gems.medium' : 'gem_pack_medium';
    if (pkg.gemsAmount <= 1000) return Platform.OS === 'ios' ? 'com.treasurehunt.gems.large' : 'gem_pack_large';
    return Platform.OS === 'ios' ? 'com.treasurehunt.gems.huge' : 'gem_pack_huge';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('recharge.title')}</Text>
        <View style={styles.balancePill}>
          <Ionicons name="diamond" size={18} color="#E91E63" />
          <Text style={styles.balanceText}>{gemBalance}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#D4A017"
          />
        }
      >
        {/* Package Grid - 2 columns */}
        <View style={styles.packageGrid}>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.packageCard}
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing === pkg.id}
            >
              {pkg.isFirstRechargeBonus && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('recharge.firstChargeBonus')}</Text>
                </View>
              )}
              <Ionicons name="diamond" size={32} color="#E91E63" />
              <Text style={styles.gemsAmount}>{pkg.gemsAmount + pkg.bonusGems}</Text>
              <Text style={styles.gemsLabel}>{t('recharge.gems')}</Text>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>¥{pkg.price}</Text>
              </View>
              {purchasing === pkg.id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buyButton}>{t('recharge.buy')}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E0E8',
  },
  balanceText: { fontSize: 16, fontWeight: '700', color: '#E91E63' },
  scrollContent: { padding: 16 },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  packageCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E0E8',
  },
  badge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#E91E63',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  gemsAmount: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginTop: 8 },
  gemsLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  priceTag: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  priceText: { fontSize: 18, fontWeight: '700', color: '#D4A017' },
  buyButton: {
    backgroundColor: '#E91E63',
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
