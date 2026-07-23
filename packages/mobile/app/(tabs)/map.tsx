import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useP2P } from '@/src/p2p';
import { SpawnedTreasure, RARITY_COLORS, COLLECTION_RADIUS_METERS } from '@/src/p2p/types';
import { getItemById } from '@/src/p2p/data/items';
import { CollectionAnimationModal } from '@/components/animations/CollectionAnimationModal';
import { LocationPermissionDialog } from '@/components/LocationPermissionDialog';
import { success as hapticSuccess } from '@/utils/haptics';
import { MarkerIconType } from '@/src/p2p/types';

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
    userMarkers,
    refreshNearby, 
    collectTreasure,
    createMarker,
    updateMarker,
    deleteMarker 
  } = useP2P();
  
  const params = useLocalSearchParams();
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null);
  const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number>(15);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedSpawn, setSelectedSpawn] = useState<SpawnedTreasure | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [refreshing, setRefreshing] = useState(false);
  const [animationVisible, setAnimationVisible] = useState(false);
  const [collectedItem, setCollectedItem] = useState<{ name: string; rarity: ItemRarity } | null>(null);
  const [showCreateMarker, setShowCreateMarker] = useState(false);
  const [longPressLocation, setLongPressLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [creatingMarker, setCreatingMarker] = useState(false);
  const [editingMarker, setEditingMarker] = useState<UserMarker | null>(null);
  const [showEditMarker, setShowEditMarker] = useState(false);
  const [editMarkerName, setEditMarkerName] = useState('');
  const [editMarkerDescription, setEditMarkerDescription] = useState('');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const appState = useRef<'active' | 'background' | 'unknown'>('active');
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const sheetTranslateY = useSharedValue(300);
  const sheetOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const closeSpawnSheet = useCallback(() => {
    'worklet';
    backdropOpacity.value = withTiming(0, { duration: 200 });
    sheetOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(300, { duration: 250 });
  }, []);

  const [isClosing, setIsClosing] = useState(false);

  const handleCloseSpawn = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    backdropOpacity.value = withTiming(0, { duration: 200 });
    sheetOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withTiming(300, { duration: 250 });
    setTimeout(() => {
      setSelectedSpawn(null);
      setIsClosing(false);
    }, 250);
  }, [isClosing]);

  useEffect(() => {
    if (params.focusMarkerId && params.focusLat && params.focusLng) {
      const lat = parseFloat(params.focusLat as string);
      const lng = parseFloat(params.focusLng as string);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setCameraCenter([lng, lat]);
        setCameraZoom(16);
        setFocusMarkerId(params.focusMarkerId as string);
      }
    }
  }, [params]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFocusMarkerId(null);
        setCameraCenter(null);
        setCameraZoom(15);
      };
    }, [])
  );

  const handleLongPress = useCallback((event: any) => {
    console.log('[Map] Long press event:', JSON.stringify(event));
    const coordinates = event.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      console.error('[Map] Invalid coordinates from long press');
      return;
    }
    const [longitude, latitude] = coordinates;
    setLongPressLocation({ latitude, longitude });
    setMarkerName('');
    setShowCreateMarker(true);
  }, []);

  const handleCreateMarker = async () => {
    if (!markerName.trim() || !longPressLocation) {
      Alert.alert(t('common.error'), t('markers.nameRequired'));
      return;
    }

    setCreatingMarker(true);
    try {
      await createMarker(
        markerName.trim(),
        longPressLocation.latitude,
        longPressLocation.longitude,
        'pin',
        '#FFD700',
        'Created from map long press'
      );
      
      Alert.alert(
        t('common.success'),
        t('markers.markerCreated'),
        [{ text: t('common.ok'), onPress: () => setShowCreateMarker(false) }]
      );
    } catch (error) {
      console.error('Create marker failed:', error);
      Alert.alert(t('common.error'), t('markers.createFailed'));
    } finally {
      setCreatingMarker(false);
    }
  };

  const handleMarkerPress = (marker: UserMarker) => {
    setEditingMarker(marker);
    setEditMarkerName(marker.name);
    setEditMarkerDescription(marker.description || '');
    setShowEditMarker(true);
  };

  const handleUpdateMarker = async () => {
    if (!editMarkerName.trim() || !editingMarker) {
      Alert.alert(t('common.error'), t('markers.nameRequired'));
      return;
    }

    setCreatingMarker(true);
    try {
      await updateMarker(editingMarker.id, {
        name: editMarkerName.trim(),
        description: editMarkerDescription.trim() || undefined,
      });
      
      Alert.alert(
        t('common.success'),
        t('common.success'),
        [{ text: t('common.ok'), onPress: () => setShowEditMarker(false) }]
      );
    } catch (error) {
      console.error('Update marker failed:', error);
      Alert.alert(t('common.error'), 'Failed to update marker');
    } finally {
      setCreatingMarker(false);
    }
  };

  const handleDeleteMarker = async () => {
    if (!editingMarker) return;
    
    Alert.alert(
      t('markers.deleteMarker'),
      t('markers.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('markers.deleteMarker'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMarker(editingMarker.id);
              setShowEditMarker(false);
              Alert.alert(t('common.success'), t('common.success'));
            } catch (error) {
              console.error('Delete marker failed:', error);
              Alert.alert(t('common.error'), t('markers.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (selectedSpawn && !isClosing) {
      backdropOpacity.value = withTiming(0.4, { duration: 200 });
      sheetOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
        mass: 0.8,
      });
    }
  }, [selectedSpawn, isClosing]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const getRarityName = (rarity: ItemRarity): string => {
    return t(`items.rarity.${rarity}`);
  };

  const updateLocation = (loc: Location.LocationObject) => {
    setLocation(loc);
    setMapRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  // Download offline map pack for current region (fire and forget)
  const downloadOfflineMap = async (lat: number, lng: number) => {
    try {
      const existingPacks = await MapboxGL.offlineManager.getPacks();
      const hasPack = existingPacks?.some(p => p.name.startsWith('treasure-cat-offline'));
      if (!hasPack) {
        console.log('[Map] No offline map found, downloading for current region...');
        await MapboxGL.offlineManager.createPack({
          name: 'treasure-cat-offline-default',
          styleURL: 'mapbox://styles/mapbox/streets-v12',
          minZoom: 10,
          maxZoom: 16,
          bounds: [[lng - 0.15, lat - 0.1], [lng + 0.15, lat + 0.1]], // ~15km radius
        }, (progress) => {
          const pct = ((progress.completedResourceCount / progress.requiredResourceCount) * 100).toFixed(0);
          console.log('[Map] Offline map download progress:', pct + '%');
        });
        console.log('[Map] Offline map download started');
      } else {
        console.log('[Map] Offline map already exists');
      }
    } catch (error) {
      console.error('[Map] Failed to download offline map:', error);
    }
  };

  const requestLocation = async () => {
    console.log('[Map] Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('[Map] Permission status:', status);
    if (status !== 'granted') {
      setPermissionDenied(true);
      setShowPermissionDialog(true);
      return;
    }

    setPermissionDenied(false);

    // Get initial position with timeout
    console.log('[Map] Getting current position...');
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('[Map] Location obtained:', loc.coords.latitude, loc.coords.longitude);
      updateLocation(loc);
      downloadOfflineMap(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error('[Map] Failed to get initial location, trying lower accuracy:', error);
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('[Map] Location obtained (balanced):', loc.coords.latitude, loc.coords.longitude);
        updateLocation(loc);
      } catch (fallbackError) {
        console.error('[Map] Failed to get location even with balanced accuracy:', fallbackError);
        setPermissionDenied(true);
      }
    }

    // Start continuous location tracking
    try {
      // Clean up any existing subscription
      if (locationSubscription.current) {
        await locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000,   // Or every 5 seconds
        },
        (newLocation) => {
          console.log('[Map] Location updated:', newLocation.coords.latitude, newLocation.coords.longitude);
          updateLocation(newLocation);
        }
      );
      console.log('[Map] Started watching position');
    } catch (error) {
      console.error('[Map] Failed to start watching position:', error);
    }
  };

  // AppState listener: refresh when returning to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        console.log('[Map] App returned to foreground, refreshing location...');
        requestLocation();
      }
      appState.current = nextAppState as 'active' | 'background' | 'unknown';
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Cleanup location subscription on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('[Map] Tab focused, requesting location...');
      requestLocation();

      return () => {
        // Cleanup watchPosition when leaving the tab
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
        }
      };
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

  // Show loading spinner while fetching location
  if (isLoading || (!location && !permissionDenied)) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={[styles.loadingText, { marginTop: 16, color: '#999' }]}>
            {t('settings.findingLocation')}
          </Text>
        </View>
      </View>
    );
  }

  // Show permission denied screen with buttons
  if (permissionDenied) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#E91E63" />
          <Text style={[styles.loadingText, { color: '#999', marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }]}>
            {t('permissions.locationDenied')}
          </Text>
          <View style={styles.buttonColumn}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={requestLocation}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, styles.settingsButton]} 
              onPress={async () => {
                console.log('[Map] Opening settings...');
                try {
                  const canOpen = await Linking.canOpenURL('app-settings:');
                  console.log('[Map] Can open settings:', canOpen);
                  if (canOpen) {
                    await Linking.openURL('app-settings:');
                  } else {
                    await Linking.openSettings();
                  }
                } catch (err) {
                  console.error('[Map] Failed to open settings:', err);
                  Alert.alert(
                    t('common.error'),
                    'Please open Settings → Apps → Treasure Cat → Permissions manually'
                  );
                }
              }}
            >
              <Ionicons name="settings-outline" size={18} color="#FFF" />
              <Text style={styles.retryText}>{t('permissions.openSettings')}</Text>
            </TouchableOpacity>
          </View>
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

  const getMarkerIconName = (iconType: string): string => {
    const iconMap: Record<string, string> = {
      star: 'star',
      flag: 'flag',
      treasure: 'diamond',
      camp: 'boat',
      note: 'document-text',
      camera: 'camera',
      heart: 'heart',
      pin: 'location',
    };
    return iconMap[iconType] || 'location';
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
        onLongPress={handleLongPress}
        contentInset={{
          top: insets.top,
          left: 0,
          bottom: insets.bottom,
          right: 0,
        }}
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
          centerCoordinate={cameraCenter || [location.coords.longitude, location.coords.latitude]}
          zoomLevel={cameraZoom}
          animationMode="easeTo"
          animationDuration={1000}
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

        {/* User Markers */}
        {userMarkers.map((marker) => (
          <MapboxGL.PointAnnotation
            key={marker.id}
            id={`user-marker-${marker.id}`}
            coordinate={[marker.longitude, marker.latitude]}
            title={marker.name}
            snippet={marker.description || 'User Marker'}
            onSelected={() => handleMarkerPress(marker)}
          >
            <View style={{
              backgroundColor: marker.color,
              width: 32,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#FFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 4,
            }}>
              <Ionicons 
                name={getMarkerIconName(marker.iconType)} 
                size={16} 
                color="#FFF" 
              />
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Bottom Left - Treasure Count + Inventory */}
      <View style={[styles.bottomLeftOverlay, { bottom: insets.bottom + 16, left: 16 }]}>
        <View style={styles.bottomPillsContainer}>
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
      </View>

      <TouchableOpacity
        style={[styles.refreshButton, { bottom: insets.bottom + 16 }]}
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
        <>
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.backdropTouchable} 
            onPress={handleCloseSpawn}
          >
            <Animated.View style={[styles.backdrop, backdropStyle]} />
          </TouchableOpacity>
          <Animated.View style={[styles.bottomSheet, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetContent}>
              <Animated.View
                entering={FadeInDown.delay(100).springify().damping(15)}
                style={styles.sheetHeader}
              >
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
                  onPress={handleCloseSpawn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify().damping(15)}>
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
                      <Text style={styles.collectButtonText}>{t('map.collect')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </>
      )}

      <CollectionAnimationModal
        visible={animationVisible}
        itemName={collectedItem?.name || ''}
        rarity={collectedItem?.rarity || 'common'}
        onClose={() => setAnimationVisible(false)}
        autoDismissDelay={2500}
      />

      <LocationPermissionDialog
        visible={showPermissionDialog}
        onClose={() => {
          setShowPermissionDialog(false);
          setPermissionDenied(false);
        }}
      />

      {/* Create Marker Modal */}
      <Modal
        visible={showCreateMarker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateMarker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="location" size={24} color="#D4A017" />
              <Text style={styles.modalTitle}>{t('markers.createMarker')}</Text>
            </View>

            <Text style={styles.modalLabel}>{t('markers.markerName')}</Text>
            <TextInput
              style={styles.modalInput}
              value={markerName}
              onChangeText={setMarkerName}
              placeholder={t('markers.namePlaceholder')}
              placeholderTextColor="#999"
              autoFocus
              maxLength={50}
            />

            {longPressLocation && (
              <View style={styles.locationInfo}>
                <Ionicons name="map-outline" size={16} color="#666" />
                <Text style={styles.locationText}>
                  {longPressLocation.latitude.toFixed(4)}, {longPressLocation.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCreateMarker(false)}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate, creatingMarker && styles.modalButtonDisabled]}
                onPress={handleCreateMarker}
                disabled={creatingMarker || !markerName.trim()}
              >
                {creatingMarker ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonTextCreate}>{t('markers.create')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Marker Modal */}
      <Modal
        visible={showEditMarker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditMarker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={24} color="#D4A017" />
              <Text style={styles.modalTitle}>{t('markers.editMarker')}</Text>
            </View>

            <Text style={styles.modalLabel}>{t('markers.markerName')}</Text>
            <TextInput
              style={styles.modalInput}
              value={editMarkerName}
              onChangeText={setEditMarkerName}
              placeholder={t('markers.namePlaceholder')}
              placeholderTextColor="#999"
              autoFocus
              maxLength={50}
            />

            <Text style={styles.modalLabel}>{t('markers.markerDescription')}</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={editMarkerDescription}
              onChangeText={setEditMarkerDescription}
              placeholder={t('markers.descriptionPlaceholder')}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <View style={styles.locationInfo}>
              <Ionicons name="map-outline" size={16} color="#666" />
              <Text style={styles.locationText}>
                {editingMarker?.latitude.toFixed(4)}, {editingMarker?.longitude.toFixed(4)}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteMarker}
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text style={styles.modalButtonTextDelete}>{t('markers.deleteMarker')}</Text>
              </TouchableOpacity>
              <View style={styles.modalButtonSpacer} />
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditMarker(false)}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonUpdate, creatingMarker && styles.modalButtonDisabled]}
                onPress={handleUpdateMarker}
                disabled={creatingMarker || !editMarkerName.trim()}
              >
                {creatingMarker ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonTextUpdate}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#D4A017',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 200,
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#1A1A1A',
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLeftOverlay: {
    position: 'absolute',
  },
  bottomPillsContainer: {
    flexDirection: 'column',
    gap: 8,
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
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
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
    paddingBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0E5',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalButtonCreate: {
    backgroundColor: '#D4A017',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextCreate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalButtonDelete: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  modalButtonTextDelete: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  modalButtonSpacer: {
    flex: 0.5,
  },
  modalButtonUpdate: {
    backgroundColor: '#D4A017',
  },
  modalButtonTextUpdate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
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