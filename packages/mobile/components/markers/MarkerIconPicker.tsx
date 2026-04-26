import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MarkerIconType } from '@/src/p2p/types';

interface MarkerIconPickerProps {
  selectedIcon: MarkerIconType;
  onSelect: (icon: MarkerIconType) => void;
  onClose: () => void;
}

const ICON_TYPES: MarkerIconType[] = ['star', 'flag', 'treasure', 'camp', 'note', 'camera', 'heart', 'pin'];

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

export function MarkerIconPicker({
  selectedIcon,
  onSelect,
  onClose,
}: MarkerIconPickerProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('markers.selectIcon')}</Text>
        </View>

        <FlatList
          data={ICON_TYPES}
          keyExtractor={(item) => item}
          numColumns={4}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isSelected = item === selectedIcon;
            return (
              <TouchableOpacity
                style={[styles.iconButton, isSelected && styles.iconButtonSelected]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={ICON_MAP[item]} 
                  size={32} 
                  color={isSelected ? '#D4A017' : '#666'} 
                />
                <Text style={[styles.iconText, isSelected && styles.iconTextSelected]}>
                  {t(`markers.icons.${item}`)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  grid: {
    padding: 16,
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    maxWidth: '25%',
  },
  iconButtonSelected: {
    borderColor: '#D4A017',
    borderWidth: 2,
    backgroundColor: '#FFF8E7',
  },
  iconText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  iconTextSelected: {
    color: '#D4A017',
  },
});