import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p';
import { MarkerIconType } from '@/src/p2p/types';

const ICON_OPTIONS: { key: MarkerIconType; label: string; icon: string }[] = [
  { key: 'star', label: 'Star', icon: 'star' },
  { key: 'flag', label: 'Flag', icon: 'flag' },
  { key: 'treasure', label: 'Treasure', icon: 'diamond' },
  { key: 'camp', label: 'Camp', icon: 'boat' },
  { key: 'note', label: 'Note', icon: 'document-text' },
  { key: 'camera', label: 'Camera', icon: 'camera' },
  { key: 'heart', label: 'Heart', icon: 'heart' },
  { key: 'pin', label: 'Pin', icon: 'location' },
];

const COLOR_OPTIONS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
];

export default function CreateMarkerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createMarker, getCurrentLocation } = useP2P();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MarkerIconType>('star');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('markers.nameRequired'));
      return;
    }

    setCreating(true);
    try {
      const location = await getCurrentLocation();
      await createMarker(
        name.trim(),
        location.latitude,
        location.longitude,
        selectedIcon,
        selectedColor,
        description.trim()
      );
      
      Alert.alert(
        t('common.success'),
        t('markers.markerCreated'),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Create marker failed:', error);
      Alert.alert(t('common.error'), t('markers.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>{t('markers.markerName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('markers.namePlaceholder')}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('markers.markerDescription')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('markers.descriptionPlaceholder')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('markers.selectIcon')}</Text>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.iconOption,
                  selectedIcon === option.key && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(option.key)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={28}
                  color={selectedIcon === option.key ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.iconLabel,
                    selectedIcon === option.key && styles.iconLabelSelected,
                  ]}
                >
                  {t(`markers.icons.${option.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('markers.selectColor')}</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, creating && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          <Text style={styles.buttonText}>
            {creating ? t('common.loading') : t('markers.createMarker')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0D5C0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0D5C0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconOptionSelected: {
    backgroundColor: '#D4A017',
    borderColor: '#D4A017',
  },
  iconLabel: {
    fontSize: 11,
    color: '#666',
  },
  iconLabelSelected: {
    color: '#FFF',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0D5C0',
  },
  colorOptionSelected: {
    borderColor: '#1A1A1A',
    borderWidth: 3,
  },
  button: {
    backgroundColor: '#D4A017',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
