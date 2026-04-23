import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useP2P } from '@/src/p2p';
import { InventoryItem, ItemRarity, RARITY_COLORS } from '@/src/p2p/types';
import { getItemById } from '@/src/p2p/data/items';

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
    rarity: ItemRarity;
  };
  quantity: number;
  poiName?: string;
  collectedAt: number;
}

export default function InventoryScreen() {
  const { inventory, nearbyPOIs, isLoading, refreshInventory } = useP2P();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshInventory();
    setRefreshing(false);
  };

  const displayItems: DisplayItem[] = useMemo(() => {
    const grouped: Record<string, DisplayItem> = {};
    
    for (const invItem of inventory) {
      const itemDef = getItemById(invItem.itemId);
      if (!itemDef) continue;
      
      const key = invItem.itemId;
      if (grouped[key]) {
        grouped[key].quantity += invItem.quantity;
      } else {
        const poi = nearbyPOIs.find(p => p.id === invItem.sourcePoiId);
        grouped[key] = {
          id: invItem.id,
          itemDef: {
            id: itemDef.id,
            name: itemDef.name,
            rarity: itemDef.rarity,
          },
          quantity: invItem.quantity,
          poiName: poi?.name,
          collectedAt: invItem.collectedAt,
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
          <Text style={styles.loadingText}>Loading backpack...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: DisplayItem }) => {
    const rarity = item.itemDef.rarity;
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
                {RARITY_NAMES[rarity]}
              </Text>
            </View>
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
        <Ionicons name="chevron-forward" size={16} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Backpack</Text>
        <Text style={styles.subtitle}>Your collected treasures</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={20} color="#D4A017" />
            <Text style={styles.statValue}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="apps-outline" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.uniqueItems}</Text>
            <Text style={styles.statLabel}>Unique</Text>
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
              <Text style={styles.statLabel}>{RARITY_NAMES[rarity as ItemRarity]}</Text>
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
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubtext}>Explore the map to find and collect treasures!</Text>
          </View>
        }
      />
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
});