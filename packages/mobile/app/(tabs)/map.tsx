import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p';
import { SpawnedTreasure, RARITY_COLORS, COLLECTION_RADIUS_METERS } from '@/src/p2p/types';
import { getItemById } from '@/src/p2p/data/items';
import { CollectionAnimationModal } from '@/components/animations/CollectionAnimationModal';
import { success as hapticSuccess } from '@/utils/haptics';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const DEFAULT_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_ICON: Record<ItemRarity, string> = {
  common: 'diamond-outline',
  rare: 'diamond',
  epic: 'star',
  legendary: 'trophy',
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const { 
    isInitialized, 
    isLoading, 
    error, 
    nearbyPOIs, 
    nearbySpawns, 
    userLocation,
    inventory,
    refreshNearby, 
    collectTreasure 
  } = useP2P();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedSpawn, setSelectedSpawn] = useState<SpawnedTreasure | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [refreshing, setRefreshing] = useState(false);
  const [animationVisible, setAnimationVisible] = useState(false);
  const [collectedItem, setCollectedItem] = useState<{ name: string; rarity: ItemRarity } | null>(null);

  const getRarityName = (rarity: ItemRarity): string => {
    return t(`rarity.${rarity}`);
  };

  const requestLocation = async () => {
    console.log('[Map] Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('[Map] Permission status:', status);
    if (status !== 'granted') {
      Alert.alert(t('settings.permissionNeeded'), t('map.tooFar'));
      return;
    }

    console.log('[Map] Getting current position...');
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    console.log('[Map] Location obtained:', loc.coords.latitude, loc.coords.longitude);
    setLocation(loc);
    setMapRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  useFocusEffect(
    useCallback(() => {
      console.log('[Map] Tab focused, requesting location...');
      requestLocation();
    }, [])
  );

  useEffect(() => {
    console.log('[Map] Effect triggered - location:', location?.coords, 'isInitialized:', isInitialized);
    if (location && isInitialized) {
      console.log('[Map] Calling refreshNearby...');
      refreshNearby(location.coords.latitude, location.coords.longitude);
    }
  }, [location, isInitialized]);

  const handleRefresh = async () => {
    if (!location || refreshing) return;
    setRefreshing(true);
    await refreshNearby(location.coords.latitude, location.coords.longitude);
    setRefreshing(false);
  };

const handleCollect = async (spawn: SpawnedTreasure) => {
    if (!location || collecting) return;

    setCollecting(true);
    try {
      const result = await collectTreasure(spawn);

      if (result.success) {
        const item = getItemById(spawn.itemId);
        
        await hapticSuccess();
        
        setCollectedItem({
          name: item?.name || t('map.unknownTreasure'),
          rarity: item?.rarity || 'common',
        });
        setAnimationVisible(true);
        setSelectedSpawn(null);
      } else {
        Alert.alert(t('common.error'), result.error || t('map.collectFailed'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('map.collectFailed'));
    } finally {
      setCollecting(false);
}
  }

  if (isLoading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="compass-outline" size={48} color="#D4A017" />
          <ActivityIndicator size="large" color="#D4A017" style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>
            {isLoading ? t('common.loading') : t('settings.findingLocation')}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#E91E63" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => requestLocation()}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getSpawnDetails = (spawn: SpawnedTreasure) => {
    const item = getItemById(spawn.itemId);
    const poi = nearbyPOIs.find(p => p.id === spawn.poiId);
    return {
      itemName: item?.name || t('map.unknownTreasure'),
      itemRarity: item?.rarity || 'common',
      poiName: poi?.name || t('map.mysteryLocation'),
    };
  };

  const visibleSpawns = nearbySpawns.filter(s => !s.isCollected);
  console.log('[Map] Rendering map with:', { 
    nearbyPOIs: nearbyPOIs.length, 
    nearbySpawns: nearbySpawns.length, 
    visibleSpawns: visibleSpawns.length,
    userLocation,
    mapRegion
  });

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/mapbox/streets-v12"
        compassEnabled={true}
        onRegionDidChange={(feature) => {
          if (feature.properties?.center) {
            setMapRegion({
              latitude: feature.properties.center[1],
              longitude: feature.properties.center[0],
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            });
          }
        }}
      >
        <MapboxGL.Camera
          zoomLevel={15}
          centerCoordinate={[location.coords.longitude, location.coords.latitude]}
          animationMode="none"
        />
        <MapboxGL.UserLocation visible={true} />
        {visibleSpawns.map((spawn) => {
          const poi = nearbyPOIs.find(p => p.id === spawn.poiId);
          if (!poi) return null;

          const details = getSpawnDetails(spawn);
          const color = RARITY_COLORS[details.itemRarity];

          return (
            <MapboxGL.PointAnnotation
              key={spawn.poiId}
              id={`marker-${spawn.poiId}`}
              coordinate={[poi.longitude, poi.latitude]}
              title={details.itemName}
              snippet={`${getRarityName(details.itemRarity)} - ${details.poiName}`}
              onSelected={() => setSelectedSpawn(spawn)}
            >
              <View style={{
                backgroundColor: color,
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#FFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Ionicons name="diamond" size={18} color="#FFF" />
              </View>
              <MapboxGL.Callout title={details.itemName} />
            </MapboxGL.PointAnnotation>
          );
        })}
      </MapboxGL.MapView>

      <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
        <View style={styles.countPill}>
          <Ionicons name="compass" size={16} color="#D4A017" />
          <Text style={styles.countText}>
            {visibleSpawns.length} {t('map.nearbyTreasures')}
          </Text>
        </View>
        <View style={styles.inventoryPill}>
          <Ionicons name="cube" size={16} color="#3B82F6" />
          <Text style={styles.inventoryText}>{inventory.length} {t('nav.inventory')}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.refreshButton, { bottom: Platform.OS === 'ios' ? 108 : 80 }]}
        onPress={handleRefresh}
        activeOpacity={0.8}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#1A1A1A" />
        ) : (
          <Ionicons name="refresh" size={22} color="#1A1A1A" />
        )}
      </TouchableOpacity>

      {selectedSpawn && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: `${RARITY_COLORS[getSpawnDetails(selectedSpawn).itemRarity]}20` }]}>
                <Ionicons
                  name={RARITY_ICON[getSpawnDetails(selectedSpawn).itemRarity] as any}
                  size={28}
                  color={RARITY_COLORS[getSpawnDetails(selectedSpawn).itemRarity]}
                />
              </View>
              <View style={styles.sheetInfo}>
                <Text style={styles.sheetTitle}>{getSpawnDetails(selectedSpawn).itemName}</Text>
                <View style={[styles.sheetRarityBadge, { backgroundColor: `${RARITY_COLORS[getSpawnDetails(selectedSpawn).itemRarity]}20` }]}>
                  <Text style={[styles.sheetRarityText, { color: RARITY_COLORS[getSpawnDetails(selectedSpawn).itemRarity] }]}>
                    {getRarityName(getSpawnDetails(selectedSpawn).itemRarity)}
                  </Text>
                </View>
                <View style={styles.sheetLocationRow}>
                  <Ionicons name="location-outline" size={13} color="#999" />
                  <Text style={styles.sheetLocation}>{getSpawnDetails(selectedSpawn).poiName}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedSpawn(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.collectButton}
              onPress={() => handleCollect(selectedSpawn)}
              disabled={collecting}
              activeOpacity={0.8}
            >
              {collecting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="hand-left" size={18} color="#FFF" />
                  <Text style={styles.collectButtonText}>{t('map.collectSuccess')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CollectionAnimationModal
        visible={animationVisible}
        itemName={collectedItem?.name || ''}
        rarity={collectedItem?.rarity || 'common'}
        onClose={() => setAnimationVisible(false)}
        autoDismissDelay={2500}
      />
    </View>
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
    backgroundColor: '#FFF8E7',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: '#E91E63',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#D4A017',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  countText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '600',
  },
  inventoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inventoryText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD93D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetContent: {
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sheetInfo: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  sheetRarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  sheetRarityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sheetLocation: {
    fontSize: 13,
    color: '#999',
  },
  closeButton: {
    padding: 4,
  },
  collectButton: {
    backgroundColor: '#D4A017',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  collectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});