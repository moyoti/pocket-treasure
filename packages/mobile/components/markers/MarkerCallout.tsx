import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { UserMarker, MarkerIconType } from '@/src/p2p/types';

interface MarkerCalloutProps {
  marker: UserMarker;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ICON_MAP: Record<MarkerIconType, string> = {
  star: 'star',
  flag: 'flag',
  treasure: 'diamond',
  camp: 'tent',
  note: 'document-text',
  camera: 'camera',
  heart: 'heart',
  pin: 'pin',
};

export function MarkerCallout({ marker, onEdit, onDelete }: MarkerCalloutProps) {
  const { t } = useTranslation();
  const { deleteMarker, identity } = useP2P();

  const [isDeleting, setIsDeleting] = React.useState(false);

  const isOwner = marker.creatorPublicKey === identity?.publicKey;

  const handleDelete = async () => {
    Alert.alert(
      t('markers.deleteMarker'),
      t('markers.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteMarker(marker.id);
              onDelete?.();
            } catch (error) {
              console.error('Failed to delete marker:', error);
              Alert.alert(t('common.error'), t('markers.deleteFailed'));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={ICON_MAP[marker.iconType]} size={24} color={marker.color} />
        <Text style={styles.name}>{marker.name}</Text>
      </View>

      {marker.description && (
        <Text style={styles.description} numberOfLines={2}>
          {marker.description}
        </Text>
      )}

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.infoText}>
          {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
        </Text>
      </View>

      {marker.isShared && (
        <View style={styles.sharedBadge}>
          <Ionicons name="share-outline" size={12} color="#3b82f6" />
          <Text style={styles.sharedText}>{t('markers.shared')}</Text>
        </View>
      )}

      {isOwner && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Ionicons name="pencil" size={16} color="#3b82f6" />
            <Text style={styles.actionText}>{t('common.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color="#dc2626" />
                <Text style={[styles.actionText, styles.deleteText]}>{t('common.delete')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 11,
    color: '#999',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  sharedText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
    paddingTop: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteText: {
    color: '#dc2626',
  },
});