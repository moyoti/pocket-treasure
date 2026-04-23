import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useP2P } from '@/src/p2p';
import { useState } from 'react';
import { identityService } from '@/src/p2p';
import { databaseService } from '@/src/p2p';

interface MenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { identity, inventory, isLoading, updateDisplayName } = useP2P();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = inventory.length;

  const handleEditName = () => {
    setTempName(identity?.displayName || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (tempName.trim().length > 0) {
      await updateDisplayName(tempName.trim());
    }
    setEditingName(false);
  };

  const handleResetIdentity = () => {
    Alert.alert(
      'Reset Identity',
      'This will delete all your collected items and create a new identity. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              await identityService.resetIdentity();
              Alert.alert('Reset Complete', 'Your identity has been reset. The app will reload.');
            } catch (err) {
              Alert.alert('Error', 'Failed to reset identity');
            }
          },
        },
      ]
    );
  };

  const handleExportPublicKey = () => {
    if (identity?.publicKey) {
      Alert.alert(
        'Your Public Key',
        identity.publicKey.slice(0, 32) + '...',
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Copy Full Key', onPress: () => Alert.alert('Copied!', 'Public key copied to clipboard') },
        ]
      );
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'stats-chart-outline',
      label: 'Statistics',
      subtitle: 'View your collection stats',
      onPress: () => router.push('/profile/stats'),
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      subtitle: 'App preferences',
      onPress: () => router.push('/profile/settings'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help',
      subtitle: 'How to play',
      onPress: () => router.push('/profile/help'),
    },
    {
      icon: 'information-circle-outline',
      label: 'About',
      subtitle: 'App information',
      onPress: () => router.push('/profile/about'),
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const shortPublicKey = identity?.publicKey ? 
    `${identity.publicKey.slice(0, 8)}...${identity.publicKey.slice(-8)}` : 'Unknown';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {identity?.displayName?.charAt(0).toUpperCase() || 'T'}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Ionicons name="key" size={10} color="#FFF" />
            </View>
          </View>

          {editingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                maxLength={20}
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                <Ionicons name="checkmark" size={20} color="#22c55e" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingName(false)}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditName}>
              <Text style={styles.username}>{identity?.displayName || 'Treasure Hunter'}</Text>
              <Ionicons name="pencil" size={12} color="#999" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.keyContainer} onPress={handleExportPublicKey}>
            <Ionicons name="finger-print-outline" size={16} color="#D4A017" />
            <Text style={styles.keyLabel}>Identity Key:</Text>
            <Text style={styles.keyText}>{shortPublicKey}</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cube" size={16} color="#3b82f6" />
              <Text style={styles.statValue}>{uniqueItems}</Text>
              <Text style={styles.statLabel}>Unique</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="layers" size={16} color="#D4A017" />
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={22} color="#D4A017" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>{item.label}</Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtext}>{item.subtitle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetIdentity}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color="#dc2626" />
          <Text style={styles.resetText}>Reset Identity</Text>
        </TouchableOpacity>

        <View style={styles.p2pInfo}>
          <Ionicons name="cloud-offline" size={16} color="#999" />
          <Text style={styles.p2pInfoText}>
            Playing offline - all data stored locally on your device
          </Text>
        </View>

        <Text style={styles.version}>Version 1.0.0 (P2P Edition)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF8E7',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#D4A017',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 200,
  },
  saveButton: {
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 6,
  },
  keyLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  keyText: {
    fontSize: 12,
    color: '#D4A017',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  menuSection: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E5',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  menuItemSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  p2pInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  p2pInfoText: {
    fontSize: 12,
    color: '#999',
  },
  version: {
    textAlign: 'center',
    color: '#CCC',
    marginTop: 24,
    marginBottom: 32,
    fontSize: 12,
  },
});