import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { InventoryItem, ItemRarity, RARITY_COLORS } from '@/src/p2p/types';
import { ITEM_DEFINITIONS } from '@/src/p2p/data';

interface TradeItemSelectionProps {
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onClose: () => void;
}

export function TradeItemSelection({
  selectedItems,
  onSelectionChange,
  onClose,
}: TradeItemSelectionProps) {
  const { t } = useTranslation();
  const { inventory } = useP2P();

  const [filter, setFilter] = useState<ItemRarity | 'all'>('all');

  const tradeableItems = inventory.filter(item => !item.isLocked);

  const filteredItems = filter === 'all'
    ? tradeableItems
    : tradeableItems.filter(item => {
        const def = ITEM_DEFINITIONS.find(d => d.id === item.itemId);
        return def?.rarity === filter;
      });

  const handleToggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const getItemDefinition = (itemId: string) => {
    return ITEM_DEFINITIONS.find(d => d.id === itemId);
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const def = getItemDefinition(item.itemId);
    const isSelected = selectedItems.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => handleToggleItem(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.itemCheck}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#D4A017" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#CCC" />
          )}
        </View>

        <View style={[styles.rarityBar, { backgroundColor: RARITY_COLORS[def?.rarity || 'common'] }]} />

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{def?.nameZh || def?.name || item.itemId.slice(0, 10)}</Text>
          <Text style={styles.itemDesc} numberOfLines={1}>
            {def?.description || t('trade.tradeable')}
          </Text>
        </View>

        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('trade.selectItems')}</Text>
        <Text style={styles.selectedCount}>
          {selectedItems.length} {t('trade.selected')}
        </Text>
      </View>

      <View style={styles.filterSection}>
        {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
          <TouchableOpacity
            key={rarity}
            style={[styles.filterButton, filter === rarity && styles.filterButtonActive]}
            onPress={() => setFilter(rarity)}
          >
            <Text style={[styles.filterText, filter === rarity && styles.filterTextActive]}>
              {rarity === 'all' ? t('inventory.all') : t(`inventory.rarity.${rarity}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tradeableItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cube-outline" size={40} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>{t('inventory.empty')}</Text>
          <Text style={styles.emptySubtext}>{t('inventory.exploreMap')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={onClose}
        >
          <Ionicons name="checkmark" size={20} color="#FFF" />
          <Text style={styles.confirmButtonText}>
            {t('common.confirm')} ({selectedItems.length})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A017',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  filterButtonActive: {
    backgroundColor: '#D4A017',
    borderColor: '#D4A017',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
  },
  itemCardSelected: {
    borderColor: '#D4A017',
    borderWidth: 2,
  },
  itemCheck: {
    padding: 12,
  },
  rarityBar: {
    width: 4,
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  quantityBadge: {
    backgroundColor: '#F5F0E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A017',
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});