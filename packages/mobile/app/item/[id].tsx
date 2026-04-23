import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useP2P } from '@/src/p2p';
import { ItemRarity, RARITY_COLORS } from '@/src/p2p/types';
import { getItemById } from '@/src/p2p/data/items';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_BG: Record<Rarity, string> = {
  common: '#F1F3F5',
  rare: '#EBF5FF',
  epic: '#F5F0FF',
  legendary: '#FFFBEB',
};

const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const RARITY_ICONS: Record<Rarity, string> = {
  common: 'diamond-outline',
  rare: 'diamond',
  epic: 'star',
  legendary: 'trophy',
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { inventory, nearbyPOIs, isLoading } = useP2P();
  const [item, setItem] = useState<{
    itemDef: { id: string; name: string; description: string; rarity: Rarity };
    quantity: number;
    poiName: string;
    collectedAt: number;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && id) {
      const invItem = inventory.find(i => i.id === id || i.itemId === id);
      if (invItem) {
        const itemDef = getItemById(invItem.itemId);
        const poi = nearbyPOIs.find(p => p.id === invItem.sourcePoiId);
        setItem({
          itemDef: itemDef ? {
            id: itemDef.id,
            name: itemDef.name,
            description: itemDef.description,
            rarity: itemDef.rarity as Rarity,
          } : {
            id: invItem.itemId,
            name: 'Unknown',
            description: '',
            rarity: 'common',
          },
          quantity: invItem.quantity,
          poiName: poi?.name || 'Unknown Location',
          collectedAt: invItem.collectedAt,
        });
      }
    }
  }, [id, inventory, nearbyPOIs, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={40} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>Item not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const rarity = item.itemDef.rarity;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: RARITY_BG[rarity] }]}>
          <Ionicons
            name={RARITY_ICONS[rarity] as any}
            size={48}
            color={RARITY_COLORS[rarity]}
          />
        </View>
        <Text style={styles.name}>{item.itemDef.name}</Text>
        <View style={[styles.rarityBadge, { backgroundColor: RARITY_BG[rarity] }]}>
          <Text style={[styles.rarityText, { color: RARITY_COLORS[rarity] }]}>
            {RARITY_NAMES[rarity]}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESCRIPTION</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.description}>{item.itemDef.description || 'A mysterious treasure waiting to be discovered.'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COLLECTION INFO</Text>
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconRow}>
              <Ionicons name="location-outline" size={16} color="#AAA" />
              <Text style={styles.infoLabel}>Location</Text>
            </View>
            <Text style={styles.infoValue}>{item.poiName}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconRow}>
              <Ionicons name="calendar-outline" size={16} color="#AAA" />
              <Text style={styles.infoLabel}>Collected</Text>
            </View>
            <Text style={styles.infoValue}>
              {new Date(item.collectedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconRow}>
              <Ionicons name="layers-outline" size={16} color="#AAA" />
              <Text style={styles.infoLabel}>Quantity</Text>
            </View>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>x{item.quantity}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={18} color="#1A1A1A" />
        <Text style={styles.backButtonText}>Back to Backpack</Text>
      </TouchableOpacity>
    </ScrollView>
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
    fontSize: 15,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    fontWeight: '700',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  rarityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rarityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    marginBottom: 8,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  description: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F5F0E5',
  },
  quantityBadge: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  quantityText: {
    color: '#D4A017',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    margin: 16,
    marginBottom: 32,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8D8',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
});