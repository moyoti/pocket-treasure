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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker, Circle } from 'react-native-amap3d';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { getNearbyItems, collectItem } from '@/api/items';
import { ItemRarity } from '@/types';
import { COLLECTION_RADIUS_METERS, RARITY_COLORS as SHARED_RARITY_COLORS } from '@treasure-hunt/shared';
import { ApiError } from '@/lib/api';

const { width, height } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 39.9042,
  longitude: 116.4074,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface SpawnedItem {
  id: string;
  latitude: number;
  longitude: number;
  itemName: string;
  itemRarity: ItemRarity;
  itemIconUrl?: string;
  poiName?: string;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#8D99AE',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#F59E0B',
};

const RARITY_LABEL: Record<ItemRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const RARITY_ICON: Record<ItemRarity, string> = {
  common: 'diamond-outline',
  rare: 'diamond',
  epic: 'star',
  legendary: 'trophy',
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [items, setItems] = useState<SpawnedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SpawnedItem | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location access is required to find nearby treasures.');
      setLoading(false);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setLocation(loc);
    setMapRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const fetchNearbyItems = async () => {
    if (!location) return;

    try {
      const nearbyItems = await getNearbyItems(
        location.coords.latitude,
        location.coords.longitude
      );
      setItems(nearbyItems);
    } catch (error) {
      console.error('Failed to fetch nearby items:', error);
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          Alert.alert('Session expired', 'Please log in again.');
        } else {
          Alert.alert('Load failed', error.message);
        }
      } else {
        Alert.alert('Load failed', 'Unable to fetch nearby treasures. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      requestLocation();
    }, [])
  );

  useEffect(() => {
    if (location) {
      fetchNearbyItems();
    }
  }, [location]);

  const handleCollect = async (item: SpawnedItem) => {
    if (!location || collecting) return;

    setCollecting(true);
    try {
      const result = await collectItem(
        item.id,
        location.coords.latitude,
        location.coords.longitude
      );

      if (result.success) {
        Alert.alert(
          'Collected!',
          `You found ${item.itemName}!\nRarity: ${RARITY_LABEL[item.itemRarity]}`,
          [{ text: 'Awesome', onPress: () => setSelectedItem(null) }]
        );
        fetchNearbyItems();
      } else {
        Alert.alert(
          'Too far away',
          `Move ${Math.round(result.distance)}m closer to collect.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Collect item error:', error);
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          Alert.alert('Session expired', 'Please log in again.');
        } else {
          Alert.alert('Collection failed', error.message);
        }
      } else {
        Alert.alert('Collection failed', error.message || 'Please try again.');
      }
    } finally {
      setCollecting(false);
    }
  };

  const handleMarkerPress = (item: SpawnedItem) => {
    setSelectedItem(item);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="compass-outline" size={48} color="#D4A017" />
          <ActivityIndicator size="large" color="#D4A017" style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Finding your location...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: {
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
          },
          zoom: 15,
        }}
        showsUserLocation={true}
        showsCompass={true}
        showsScale={true}
        zoomControlsEnabled={false}
        onCameraIdle={(event) => {
          if (event.nativeEvent) {
            setMapRegion({
              latitude: event.nativeEvent.latitude,
              longitude: event.nativeEvent.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }}
      >
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <Circle
              center={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              radius={COLLECTION_RADIUS_METERS}
              strokeWidth={1.5}
              strokeColor={`${RARITY_COLORS[item.itemRarity]}80`}
              fillColor={`${RARITY_COLORS[item.itemRarity]}15`}
            />
            <Marker
              position={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              title={item.itemName}
              snippet={`${RARITY_LABEL[item.itemRarity]} - ${item.poiName || 'Treasure'}`}
              onPress={() => handleMarkerPress(item)}
            >
              <View
                style={[
                  styles.markerContainer,
                  { borderColor: RARITY_COLORS[item.itemRarity] },
                ]}
              >
                <Ionicons
                  name={RARITY_ICON[item.itemRarity] as any}
                  size={18}
                  color={RARITY_COLORS[item.itemRarity]}
                />
              </View>
              <View style={[styles.markerArrow, { borderTopColor: RARITY_COLORS[item.itemRarity] }]} />
            </Marker>
          </React.Fragment>
        ))}
      </MapView>

      {/* Top overlay - nearby count */}
      <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
        <View style={styles.countPill}>
          <Ionicons name="compass" size={16} color="#D4A017" />
          <Text style={styles.countText}>
            {items.length} treasure{items.length !== 1 ? 's' : ''} nearby
          </Text>
        </View>
      </View>

      {/* Refresh button */}
      <TouchableOpacity
        style={[styles.refreshButton, { bottom: Platform.OS === 'ios' ? 108 : 80 }]}
        onPress={fetchNearbyItems}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={22} color="#1A1A1A" />
      </TouchableOpacity>

      {/* Selected item bottom sheet */}
      {selectedItem && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: `${RARITY_COLORS[selectedItem.itemRarity]}20` }]}>
                <Ionicons
                  name={RARITY_ICON[selectedItem.itemRarity] as any}
                  size={28}
                  color={RARITY_COLORS[selectedItem.itemRarity]}
                />
              </View>
              <View style={styles.sheetInfo}>
                <Text style={styles.sheetTitle}>{selectedItem.itemName}</Text>
                <View style={[styles.sheetRarityBadge, { backgroundColor: `${RARITY_COLORS[selectedItem.itemRarity]}20` }]}>
                  <Text style={[styles.sheetRarityText, { color: RARITY_COLORS[selectedItem.itemRarity] }]}>
                    {RARITY_LABEL[selectedItem.itemRarity]}
                  </Text>
                </View>
                {selectedItem.poiName && (
                  <View style={styles.sheetLocationRow}>
                    <Ionicons name="location-outline" size={13} color="#999" />
                    <Text style={styles.sheetLocation}>{selectedItem.poiName}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedItem(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.collectButton}
              onPress={() => handleCollect(selectedItem)}
              disabled={collecting}
              activeOpacity={0.8}
            >
              {collecting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="hand-left" size={18} color="#FFF" />
                  <Text style={styles.collectButtonText}>Collect Treasure</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  map: {
    width: width,
    height: height,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  markerArrow: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  topOverlay: {
    position: 'absolute',
    left: 16,
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
