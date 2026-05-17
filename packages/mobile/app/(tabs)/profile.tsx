import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p';
import { useState, useEffect } from 'react';
import { identityService } from '@/src/p2p';
import { databaseService } from '@/src/p2p';
import { BackupMnemonicModal } from '@/components/backup/BackupMnemonicModal';
import { BackupRestoreModal } from '@/components/backup/BackupRestoreModal';
import { QRCodeDisplay, QRCodeScanner } from '@/components/qr';
import { Share } from 'react-native';
import * as Linking from 'expo-linking';

interface MenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { identity, inventory, isLoading, updateDisplayName, tradeHistory, areaUnlockProgress, userMarkers, achievements } = useP2P();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [isBackedUp, setIsBackedUp] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    checkBackupStatus();
  }, []);

  const checkBackupStatus = async () => {
    try {
      const backedUp = await identityService.isMnemonicBackedUp();
      setIsBackedUp(backedUp);
    } catch (error) {
      console.error('Failed to check backup status:', error);
    }
  };

  const handleBackup = () => {
    setShowBackupModal(true);
  };

  const handleBackupRestore = () => {
    setShowBackupRestoreModal(true);
  };

  const handleRecover = () => {
    router.push('/recover' as any);
  };

  const handleShowQR = () => {
    setShowQRDisplay(true);
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = async (data: string) => {
    setShowQRScanner(false);
    
    // Validate that it's a valid public key (64 character hex string)
    const isValidKey = /^[a-f0-9]{64}$/.test(data.toLowerCase());
    
    if (!isValidKey) {
      Alert.alert(
        t('scanner.invalidQR'),
        t('scanner.invalidProfileKey'),
        [{ text: t('common.close') }]
      );
      return;
    }
    
    // Add friend or start trade
    Alert.alert(
      t('friends.addFriend'),
      `${t('friends.scanProfileKey')}: ${data.slice(0, 16)}...${data.slice(-16)}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('friends.addFriend'), onPress: () => handleAddFriend(data) },
        { text: t('trade.startTrade'), onPress: () => handleTradeWithKey(data) },
      ]
    );
  };

  const handleAddFriend = async (publicKey: string) => {
    // TODO: Implement friend addition logic
    Alert.alert(
      t('common.success'),
      `${t('friends.friendAdded')} ${publicKey.slice(0, 8)}...`
    );
  };

  const handleTradeWithKey = async (publicKey: string) => {
    // Navigate to trade screen with public key
    router.push({
      pathname: '/trade' as any,
      params: { targetPublicKey: publicKey },
    });
  };

  const handleShareProfile = async () => {
    if (!identity?.publicKey) return;
    
    const shareUrl = Linking.createURL(`/profile/${identity.publicKey}`);
    
    try {
      await Share.share({
        message: `${t('profile.checkOutMyProfile')} ${shareUrl}`,
        url: shareUrl,
        title: t('profile.shareProfile'),
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

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
      t('settings.resetSettings'),
      t('settings.resetIdentityConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetSettings'),
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              await identityService.resetIdentity();
              Alert.alert(t('common.success'), t('settings.identityReset'));
            } catch (err) {
              Alert.alert(t('common.error'), t('settings.identityResetFailed'));
            }
          },
        },
      ]
    );
  };

  const handleExportPublicKey = () => {
    if (identity?.publicKey) {
      Alert.alert(
        t('profile.title'),
        identity.publicKey.slice(0, 32) + '...',
        [
          { text: t('common.close'), style: 'cancel' },
          { text: t('settings.copyFullKey'), onPress: () => Alert.alert(t('common.success'), t('settings.publicKeyCopied')) },
        ]
      );
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'trophy-outline',
      label: t('items.screens.achievements'),
      subtitle: `${achievements.filter(a => a.unlockedAt).length} ${t('profile.unlocked')}`,
      onPress: () => router.push('/achievements' as any),
    },
    {
      icon: 'stats-chart-outline',
      label: t('items.screens.statistics'),
      subtitle: t('settings.viewCollectionStats'),
      onPress: () => router.push('/profile/stats'),
    },
    {
      icon: 'map-outline',
      label: t('exploration.title'),
      subtitle: `${areaUnlockProgress.unlocked}/${areaUnlockProgress.total} ${t('exploration.unlockedAreas')}`,
      onPress: () => router.push('/profile/exploration' as any),
    },
    {
      icon: 'swap-horizontal-outline',
      label: t('trade.tradeHistory'),
      subtitle: `${tradeHistory.length} ${t('profile.trades')}`,
      onPress: () => {
        if (tradeHistory.length > 0) {
          Alert.alert(
            t('trade.tradeHistory'),
            tradeHistory.map(trade => 
              `${t('trade.tradedWith')} ${trade.partnerDisplayName || 'Unknown'} - ${new Date(trade.tradedAt).toLocaleDateString()}`
            ).join('\n'),
            [{ text: t('common.close') }]
          );
        } else {
          Alert.alert(t('trade.tradeHistory'), t('trade.noTradeHistory'));
        }
      },
    },
    {
      icon: 'pin-outline',
      label: t('markers.title'),
      subtitle: `${userMarkers.length} ${t('profile.markers')}`,
      onPress: () => router.push('/markers' as any),
    },
    {
      icon: 'settings-outline',
      label: t('items.screens.settings'),
      subtitle: t('profile.appPreferences'),
      onPress: () => router.push('/profile/settings'),
    },
    {
      icon: isBackedUp ? 'shield-checkmark' : 'shield-outline',
      label: t('backup.backupIdentity'),
      subtitle: isBackedUp ? t('backup.backedUp') : t('backup.notBackedUp'),
      onPress: handleBackup,
    },
    {
      icon: 'cloud-upload-outline',
      label: 'Backup All Data',
      subtitle: 'Backup identity + all game data',
      onPress: handleBackupRestore,
    },
    {
      icon: 'download-outline',
      label: t('backup.recoverIdentity'),
      subtitle: t('backup.recoverInstructions'),
      onPress: handleRecover,
    },
    {
      icon: 'help-circle-outline',
      label: t('items.screens.help'),
      subtitle: t('profile.howToPlay'),
      onPress: () => router.push('/profile/help'),
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const shortPublicKey = identity?.publicKey ? 
    `${identity.publicKey.slice(0, 8)}...${identity.publicKey.slice(-8)}` : t('common.error');

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
              <Text style={styles.username}>{identity?.displayName || t('nav.profile')}</Text>
              <Ionicons name="pencil" size={12} color="#999" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.keyContainer} onPress={handleExportPublicKey}>
            <Ionicons name="finger-print-outline" size={16} color="#D4A017" />
            <Text style={styles.keyLabel}>{t('profile.title')} Key:</Text>
            <Text style={styles.keyText}>{shortPublicKey}</Text>
          </TouchableOpacity>

          {/* QR Code Actions */}
          <View style={styles.qrActions}>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={handleShowQR}
            >
              <Ionicons name="qr-code-outline" size={20} color="#D4A017" />
              <Text style={styles.qrButtonText}>{t('profile.showQR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={handleScanQR}
            >
              <Ionicons name="scan-outline" size={20} color="#D4A017" />
              <Text style={styles.qrButtonText}>{t('profile.scanQR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={handleShareProfile}
            >
              <Ionicons name="share-outline" size={20} color="#D4A017" />
              <Text style={styles.qrButtonText}>{t('profile.share')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cube" size={16} color="#3b82f6" />
              <Text style={styles.statValue}>{uniqueItems}</Text>
              <Text style={styles.statLabel}>{t('market.unique')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="layers" size={16} color="#D4A017" />
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statLabel}>{t('market.total')}</Text>
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
          <Text style={styles.resetText}>{t('settings.resetSettings')}</Text>
        </TouchableOpacity>

        <View style={styles.p2pInfo}>
          <Ionicons name="cloud-offline" size={16} color="#999" />
          <Text style={styles.p2pInfoText}>
            {t('profile.playingOffline')}
          </Text>
        </View>

        <Text style={styles.version}>{t('profile.version', { version: '1.0.0' })}</Text>
      </ScrollView>
      
      <BackupMnemonicModal
        visible={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onComplete={() => {
          setShowBackupModal(false);
          checkBackupStatus();
        }}
      />
      
      <BackupRestoreModal
        visible={showBackupRestoreModal}
        onClose={() => setShowBackupRestoreModal(false)}
        onRestoreComplete={() => {
          setShowBackupRestoreModal(false);
          // App needs restart after restore, user will do it manually
        }}
      />
      
      {/* QR Code Display Modal */}
      <QRCodeDisplay
        visible={showQRDisplay}
        onClose={() => setShowQRDisplay(false)}
        value={identity?.publicKey || ''}
        title={t('profile.profileKey')}
        size={220}
      />
      
      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScanned}
        title={t('profile.scanToConnect')}
      />
    </SafeAreaView>
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
  qrActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D5C0',
  },
  qrButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4A017',
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

function BackupModalWrapper() {
  return null;
}