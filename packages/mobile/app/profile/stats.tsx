import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useP2P } from '@/src/p2p';
import { ITEM_DEFINITIONS } from '@/src/p2p/data';

const RARITY_COLORS: Record<string, string> = {
  common: '#8D99AE',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#F59E0B',
};

const RARITY_NAMES: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common'];

export default function StatsScreen() {
  const { inventory, isLoading, refreshInventory } = useP2P();

  const itemLookup = useMemo(() => {
    const map = new Map<string, typeof ITEM_DEFINITIONS[0]>();
    ITEM_DEFINITIONS.forEach(item => map.set(item.id, item));
    return map;
  }, []);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const uniqueItemIds = new Set(inventory.map(item => item.itemId));
    const uniqueItems = uniqueItemIds.size;
    
    const byRarity: Record<string, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    
    inventory.forEach(invItem => {
      const definition = itemLookup.get(invItem.itemId);
      const rarity = definition?.rarity || 'common';
      byRarity[rarity] = (byRarity[rarity] || 0) + 1;
    });
    
    return { totalItems, uniqueItems, byRarity };
  }, [inventory, itemLookup]);

  const handleRefresh = async () => {
    await refreshInventory();
  };

  if (isLoading && inventory.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </View>
    );
  }

  const totalByRarity = Object.values(stats.byRarity).reduce((a, b) => a + b, 0);

  const sortedRarityData = RARITY_ORDER
    .filter(rarity => stats.byRarity[rarity] > 0)
    .map(rarity => [rarity, stats.byRarity[rarity]] as [string, number]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#D4A017" />}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.mainStatsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="layers-outline" size={28} color="#D4A017" />
          <Text style={styles.statNumber}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Total Collected</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="apps-outline" size={28} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.uniqueItems}</Text>
          <Text style={styles.statLabel}>Unique Items</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RARITY DISTRIBUTION</Text>
        <View style={styles.sectionCard}>
          {sortedRarityData.length > 0 ? (
            sortedRarityData.map(([rarity, count]) => (
              <View key={rarity} style={styles.rarityItem}>
                <View style={styles.rarityInfo}>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] || '#999' }]} />
                  <Text style={styles.rarityName}>{RARITY_NAMES[rarity] || rarity}</Text>
                </View>
                <View style={styles.rarityBarContainer}>
                  <View
                    style={[
                      styles.rarityBar,
                      {
                        backgroundColor: RARITY_COLORS[rarity] || '#999',
                        width: `${totalByRarity > 0 ? (count / totalByRarity) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.rarityCount}>{count}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={32} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>No items collected yet</Text>
              <Text style={styles.emptySubtext}>Explore the map to find treasures!</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR COLLECTION</Text>
        <View style={styles.sectionCard}>
          <View style={styles.localInfoRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#10B981" />
            <Text style={styles.localInfoText}>
              All data stored locally on your device
            </Text>
          </View>
          <View style={styles.localInfoRow}>
            <Ionicons name="sync-outline" size={20} color="#3b82f6" />
            <Text style={styles.localInfoText}>
              Trade with nearby players via P2P
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color="#D4A017" />
        <Text style={styles.tipText}>
          Keep exploring the map and collecting items to improve your stats!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    marginBottom: 8,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rarityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  rarityName: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  rarityBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0E8D8',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  rarityBar: {
    height: '100%',
    borderRadius: 3,
  },
  rarityCount: {
    width: 32,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#AAA',
  },
  localInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  localInfoText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
});