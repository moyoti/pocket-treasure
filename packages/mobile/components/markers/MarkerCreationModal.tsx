import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { MarkerIconType } from '@/src/p2p/types';
import { MarkerIconPicker } from './MarkerIconPicker';

interface MarkerCreationModalProps {
  visible: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onCreated?: () => void;
}

const MARKER_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
];

export function MarkerCreationModal({
  visible,
  latitude,
  longitude,
  onClose,
  onCreated,
}: MarkerCreationModalProps) {
  const { t } = useTranslation();
  const { createMarker, identity } = useP2P();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconType, setIconType] = useState<MarkerIconType>('star');
  const [color, setColor] = useState('#FFD700');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('markers.nameRequired'));
      return;
    }

    setIsCreating(true);
    try {
      await createMarker(
        name.trim(),
        latitude,
        longitude,
        iconType,
        color,
        description.trim() || undefined
      );
      
      Alert.alert(t('markers.markerCreated'), '', [
        { text: t('common.close'), onPress: () => {
          setName('');
          setDescription('');
          onCreated?.();
          onClose();
        }}
      ]);
    } catch (error) {
      console.error('Failed to create marker:', error);
      Alert.alert(t('common.error'), t('markers.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('markers.createMarker')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>{t('markers.markerName')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('markers.namePlaceholder')}
              maxLength={50}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>{t('markers.description')}</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('markers.descriptionPlaceholder')}
              maxLength={200}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>{t('markers.iconType')}</Text>
            <TouchableOpacity
              style={styles.iconPickerButton}
              onPress={() => setShowIconPicker(true)}
            >
              <Ionicons name={ICON_MAP[iconType]} size={24} color={color} />
              <Text style={styles.iconPickerText}>{t(`markers.icons.${iconType}`)}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>{t('markers.color')}</Text>
            <View style={styles.colorGrid}>
              {MARKER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorButton, color === c && styles.colorButtonSelected]}
                  onPress={() => setColor(c)}
                >
                  <View style={[styles.colorCircle, { backgroundColor: c }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color="#3b82f6" />
            <Text style={styles.locationText}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.createButtonText}>{t('markers.create')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {showIconPicker && (
          <MarkerIconPicker
            selectedIcon={iconType}
            onSelect={(icon) => {
              setIconType(icon);
              setShowIconPicker(false);
            }}
            onClose={() => setShowIconPicker(false)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const ICON_MAP: Record<MarkerIconType, keyof typeof Ionicons.glyphMap> = {
  star: 'star',
  flag: 'flag',
  treasure: 'diamond',
  camp: 'bonfire' as keyof typeof Ionicons.glyphMap,
  note: 'document-text',
  camera: 'camera',
  heart: 'heart',
  pin: 'pin',
};

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
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    fontSize: 15,
    color: '#1A1A1A',
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 12,
  },
  iconPickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  colorButtonSelected: {
    borderColor: '#D4A017',
    borderWidth: 2,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8D8',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#D4A017',
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});