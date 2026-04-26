import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { InventoryItem, ItemRarity, RARITY_COLORS } from '@/src/p2p/types';
import { getItemById } from '@/src/p2p/data/items';
import {
  SYNTHESIS_RECIPES,
  SynthesisRecipe,
} from '@/src/p2p/data/synthesis';
import { RarityGlow, CelebrationAnimation } from '@/components/animations';
import { celebration as hapticCelebration, error as hapticError } from '@/utils/haptics';

type SelectedItem = { inventoryItem: InventoryItem; selected: boolean };

const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];

export default function SynthesisScreen() {
  const { t } = useTranslation();
  const { inventory, profile, synthesizeItems } = useP2P();
  
  const [selectedRecipe, setSelectedRecipe] = useState<SynthesisRecipe | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [resultItem, setResultItem] = useState<{ name: string; rarity: ItemRarity } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFailure, setShowFailure] = useState(false);

  const itemsByRarity = useMemo(() => {
    const grouped: Record<ItemRarity, InventoryItem[]> = {
      common: [],
      rare: [],
      epic: [],
      legendary: [],
    };
    inventory.forEach(item => {
      const def = getItemById(item.itemId);
      if (def) {
        grouped[def.rarity].push(item);
      }
    });
    return grouped;
  }, [inventory]);

  const handleSelectRecipe = (recipe: SynthesisRecipe) => {
    setSelectedRecipe(recipe);
    setSelectedItems([]);
  };

  const handleToggleItem = (item: InventoryItem) => {
    if (!selectedRecipe) return;
    
    const existing = selectedItems.find(si => si.inventoryItem.id === item.id);
    if (existing) {
      setSelectedItems(prev => prev.filter(si => si.inventoryItem.id !== item.id));
    } else if (selectedItems.length < selectedRecipe.inputCount) {
      setSelectedItems(prev => [...prev, { inventoryItem: item, selected: true }]);
    }
  };

  const canSynthesize = useMemo(() => {
    if (!selectedRecipe || !profile) return false;
    if (selectedItems.length !== selectedRecipe.inputCount) return false;
    if (profile.coins < selectedRecipe.coinCost) return false;
    return true;
  }, [selectedRecipe, selectedItems, profile]);

  const handleSynthesize = useCallback(async () => {
    if (!selectedRecipe || !canSynthesize) return;

    setIsSynthesizing(true);
    try {
      const inventoryItemIds = selectedItems.map(si => si.inventoryItem.id);
      const result = await synthesizeItems(inventoryItemIds, selectedRecipe.id);

      if (result.success && result.newItemId) {
        await hapticCelebration();
        const newItemDef = getItemById(result.newItemId);
        setResultItem({
          name: newItemDef?.name || 'Unknown',
          rarity: result.newItemRarity || 'rare',
        });
        setShowCelebration(true);
        setSelectedItems([]);
      } else {
        await hapticError();
        setShowFailure(true);
        setSelectedItems([]);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('synthesis.failed'));
    } finally {
      setIsSynthesizing(false);
    }
  }, [selectedRecipe, canSynthesize, selectedItems, synthesizeItems, t]);

  const getRarityName = (rarity: ItemRarity): string => t(`rarity.${rarity}`);

  const renderRecipeCard = (recipe: SynthesisRecipe) => {
    const availableCount = itemsByRarity[recipe.inputRarity].length;
    const isSelected = selectedRecipe?.id === recipe.id;

    return (
      <TouchableOpacity
        key={recipe.id}
        style={[styles.recipeCard, isSelected && styles.recipeCardSelected]}
        onPress={() => handleSelectRecipe(recipe)}
        activeOpacity={0.7}
      >
        <View style={styles.recipeHeader}>
          <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[recipe.inputRarity]}20` }]}>
            <Text style={[styles.rarityBadgeText, { color: RARITY_COLORS[recipe.inputRarity] }]}>
              {recipe.inputCount} {getRarityName(recipe.inputRarity)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#666" />
          <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[recipe.outputRarity]}20` }]}>
            <Text style={[styles.rarityBadgeText, { color: RARITY_COLORS[recipe.outputRarity] }]}>
              1 {getRarityName(recipe.outputRarity)}
            </Text>
          </View>
        </View>

        <Text style={styles.recipeDesc}>
          {t('language') === 'ja' ? recipe.descriptionJa : recipe.descriptionEn}
        </Text>

        <View style={styles.recipeFooter}>
          <View style={styles.recipeStat}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.recipeStatText}>
              {(recipe.successRate * 100).toFixed(0)}% {t('synthesis.successRate')}
            </Text>
          </View>
          <View style={styles.recipeStat}>
            <Ionicons name="cash" size={16} color="#D4A017" />
            <Text style={styles.recipeStatText}>{recipe.coinCost} {t('shop.coins')}</Text>
          </View>
        </View>

        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityText}>
            {t('synthesis.available')}: {availableCount}/{recipe.inputCount}
          </Text>
          {availableCount >= recipe.inputCount && (
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedItem = ({ item }: { item: SelectedItem }) => {
    const itemDef = getItemById(item.inventoryItem.itemId);
    if (!itemDef) return null;

    return (
      <TouchableOpacity
        style={styles.selectedItemCard}
        onPress={() => handleToggleItem(item.inventoryItem)}
      >
        <RarityGlow rarity={itemDef.rarity} size={60}>
          <View style={[styles.itemIconBox, { backgroundColor: `${RARITY_COLORS[itemDef.rarity]}20` }]}>
            <Ionicons name="diamond" size={24} color={RARITY_COLORS[itemDef.rarity]} />
          </View>
        </RarityGlow>
        <Text style={styles.selectedItemName}>{itemDef.name}</Text>
        <Ionicons name="close-circle" size={20} color="#E91E63" style={styles.removeItemIcon} />
      </TouchableOpacity>
    );
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    if (!selectedRecipe) return null;
    
    const itemDef = getItemById(item.itemId);
    if (!itemDef || itemDef.rarity !== selectedRecipe.inputRarity) return null;

    const isSelected = selectedItems.some(si => si.inventoryItem.id === item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.inventoryItemCard, isSelected && styles.inventoryItemSelected]}
        onPress={() => handleToggleItem(item)}
        disabled={isSelected || selectedItems.length >= selectedRecipe.inputCount}
      >
        <View style={[styles.itemIconBox, { backgroundColor: `${RARITY_COLORS[itemDef.rarity]}20` }]}>
          <Ionicons name="diamond" size={20} color={RARITY_COLORS[itemDef.rarity]} />
        </View>
        <Text style={styles.inventoryItemName} numberOfLines={1}>{itemDef.name}</Text>
        {isSelected && <Ionicons name="checkmark-circle" size={18} color="#22c55e" />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('synthesis.title')}</Text>
        <View style={styles.gemsRow}>
          <Ionicons name="cash" size={18} color="#D4A017" />
          <Text style={styles.gemsText}>{profile?.coins || 0}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('synthesis.selectRecipe')}</Text>
        <View style={styles.recipesContainer}>
          {SYNTHESIS_RECIPES.map(renderRecipeCard)}
        </View>

        {selectedRecipe && (
          <>
            <Text style={styles.sectionTitle}>
              {t('synthesis.selectItems')} ({selectedItems.length}/{selectedRecipe.inputCount})
            </Text>

            {selectedItems.length > 0 && (
              <FlatList
                data={selectedItems}
                renderItem={renderSelectedItem}
                keyExtractor={item => item.inventoryItem.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedItemsList}
              />
            )}

            <Text style={styles.sectionTitle}>{t('synthesis.availableItems')}</Text>
            <FlatList
              data={itemsByRarity[selectedRecipe.inputRarity]}
              renderItem={renderInventoryItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inventoryList}
              ListEmptyComponent={
                <View style={styles.emptyItemsBox}>
                  <Ionicons name="cube-outline" size={32} color="#CCC" />
                  <Text style={styles.emptyText}>{t('synthesis.noItems')}</Text>
                </View>
              }
            />

            <TouchableOpacity
              style={[styles.synthesizeButton, !canSynthesize && styles.synthesizeDisabled]}
              onPress={handleSynthesize}
              disabled={!canSynthesize || isSynthesizing}
            >
              {isSynthesizing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="construct" size={20} color="#FFF" />
                  <Text style={styles.synthesizeText}>
                    {t('synthesis.fuse')} ({selectedRecipe.coinCost} {t('shop.coins')})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {profile && profile.coins < selectedRecipe.coinCost && (
              <Text style={styles.insufficientGems}>
                {t('synthesis.insufficientCoins')}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <CelebrationAnimation
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        achievementName={t('synthesis.success')}
        rewards={{ title: resultItem ? `${resultItem.name} (${getRarityName(resultItem.rarity)})` : '' }}
      />

      {showFailure && (
        <View style={styles.failureOverlay}>
          <View style={styles.failureContent}>
            <Ionicons name="sad-outline" size={48} color="#E91E63" />
            <Text style={styles.failureTitle}>{t('synthesis.failed')}</Text>
            <Text style={styles.failureDesc}>{t('synthesis.tryAgain')}</Text>
            <TouchableOpacity
              style={styles.failureButton}
              onPress={() => setShowFailure(false)}
            >
              <Text style={styles.failureButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  gemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gemsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9B59B6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  recipesContainer: {
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  recipeCardSelected: {
    borderColor: '#D4A017',
    borderWidth: 2,
    backgroundColor: '#FFFDF5',
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rarityBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  recipeDesc: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeStatText: {
    fontSize: 12,
    color: '#666',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  availabilityText: {
    fontSize: 12,
    color: '#888',
  },
  selectedItemsList: {
    gap: 12,
    paddingBottom: 8,
  },
  selectedItemCard: {
    alignItems: 'center',
    width: 80,
  },
  itemIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItemName: {
    fontSize: 12,
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
  },
  removeItemIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  inventoryList: {
    gap: 10,
    paddingBottom: 16,
  },
  inventoryItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 8,
  },
  inventoryItemSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#F0FDF4',
  },
  inventoryItemName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  emptyItemsBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 8,
  },
  synthesizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A017',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 24,
    gap: 8,
  },
  synthesizeDisabled: {
    backgroundColor: '#CCC',
  },
  synthesizeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  insufficientGems: {
    fontSize: 12,
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 24,
  },
  failureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failureContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
  },
  failureTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E91E63',
    marginTop: 16,
  },
  failureDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  failureButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  failureButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});