import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p';
import { UserMarker } from '@/src/p2p/markers';

export default function MarkersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userMarkers, deleteMarker } = useP2P();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handleDelete = (marker: UserMarker) => {
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
              await deleteMarker(marker.id);
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert(t('common.error'), t('markers.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleCreate = () => {
    router.push('/markers/create' as any);
  };

  const handleViewOnMap = (marker: UserMarker) => {
    router.push({
      pathname: '/(tabs)/map' as any,
      params: {
        focusMarkerId: marker.id,
        focusLat: marker.latitude.toString(),
        focusLng: marker.longitude.toString(),
        focusName: marker.name,
      },
    });
  };

  const renderMarker = ({ item }: { item: UserMarker }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewOnMap(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getItemColor(item.icon, item.color) }]}>
        <Ionicons name={getIconName(item.icon)} size={24} color="#FFF" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text style={styles.coordinates}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (userMarkers.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('markers.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>{t('markers.noMarkers')}</Text>
          <Text style={styles.emptySubtext}>{t('markers.createFirst')}</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>{t('markers.create')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('markers.title')}</Text>
      </View>

      <FlatList
        data={userMarkers}
        keyExtractor={(item) => item.id}
        renderItem={renderMarker}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>{t('markers.noMarkers')}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function getItemColor(icon: string, color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  
  const colorMap: Record<string, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#EAB308',
    purple: '#A855F7',
    orange: '#F97316',
    pink: '#EC4899',
  };
  
  return colorMap[color] || '#3B82F6';
}

function getIconName(iconKey: string): string {
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
  
  return iconMap[iconKey] || 'location';
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 11,
    color: '#999',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F0E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4A017',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
