import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getGemBalance, getRechargePackages, createRechargeOrder, mockPaymentCallback } from '../../lib/api';

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

  const handlePurchase = async (pkg: RechargePackage) => {
    try {
      setPurchasing(pkg.id);
      const order = await createRechargeOrder(pkg.id);
      await mockPaymentCallback(order.orderId);
      const balanceData = await getGemBalance();
      setGemBalance(balanceData.balance);
      Alert.alert('充值成功', `获得 ${pkg.gemsAmount + pkg.bonusGems} 宝石！`);
    } catch (error) {
      Alert.alert('充值失败', '请稍后重试');
    } finally {
      setPurchasing(null);
    }
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
        <Text style={styles.title}>充值中心</Text>
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
                  <Text style={styles.badgeText}>首充双倍</Text>
                </View>
              )}
              <Ionicons name="diamond" size={32} color="#E91E63" />
              <Text style={styles.gemsAmount}>{pkg.gemsAmount + pkg.bonusGems}</Text>
              <Text style={styles.gemsLabel}>宝石</Text>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>¥{pkg.price}</Text>
              </View>
              {purchasing === pkg.id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buyButton}>购买</Text>
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
