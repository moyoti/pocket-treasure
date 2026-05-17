import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { backupService } from '@/src/p2p/identity/BackupService';

interface BackupRestoreModalProps {
  visible: boolean;
  onClose: () => void;
  onRestoreComplete: () => void;
}

export function BackupRestoreModal({
  visible,
  onClose,
  onRestoreComplete,
}: BackupRestoreModalProps) {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Array<{ filename: string; path: string; timestamp: number; size: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBackups();
    }
  }, [visible]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupList = await backupService.listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('[BackupRestoreModal] Failed to load backups:', error);
      Alert.alert(t('common.error'), 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackingUp(true);
      const result = await backupService.createFullBackup();
      
      if (result.success && result.backupPath) {
        // 提示用户备份成功，并询问是否分享
        Alert.alert(
          t('common.success'),
          'Backup created successfully! Would you like to share it?',
          [
            {
              text: t('common.later'),
              style: 'cancel',
            },
            {
              text: 'Share',
              onPress: () => shareBackup(result.backupPath!),
            },
          ]
        );
        await loadBackups();
      } else {
        Alert.alert(t('common.error'), result.error || 'Backup failed');
      }
    } catch (error) {
      console.error('[BackupRestoreModal] Backup failed:', error);
      Alert.alert(t('common.error'), 'Failed to create backup');
    } finally {
      setBackingUp(false);
    }
  };

  const shareBackup = async (backupPath: string) => {
    try {
      if (Platform.OS === 'web') {
        await Sharing.shareAsync(backupPath);
      } else {
        await Share.share({
          url: backupPath,
          title: 'Treasure Cat Backup',
          message: 'Your Treasure Cat game backup file',
        });
      }
    } catch (error) {
      console.error('[BackupRestoreModal] Share failed:', error);
    }
  };

  const handleRestore = async (backupPath: string) => {
    Alert.alert(
      'Restore Backup',
      'This will replace all your current game data with the backup. Continue?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setRestoring(true);
              const result = await backupService.restoreBackup(backupPath);
              
              if (result.success) {
                Alert.alert(
                  t('common.success'),
                  'Backup restored successfully! Please restart the app.',
                  [
                    {
                      text: t('common.ok'),
                      onPress: onRestoreComplete,
                    },
                  ]
                );
              } else {
                Alert.alert(t('common.error'), result.error || 'Restore failed');
              }
            } catch (error) {
              console.error('[BackupRestoreModal] Restore failed:', error);
              Alert.alert(t('common.error'), 'Failed to restore backup');
            } finally {
              setRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const backupPath = result.assets[0].uri;
      await handleRestore(backupPath);
    } catch (error) {
      console.error('[BackupRestoreModal] Import failed:', error);
      Alert.alert(t('common.error'), 'Failed to import backup');
    }
  };

  const handleDelete = async (backupPath: string, filename: string) => {
    Alert.alert(
      'Delete Backup',
      `Delete ${filename}?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await backupService.deleteBackup(backupPath);
              await loadBackups();
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to delete backup');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Backup & Restore</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Create Backup Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Backup</Text>
              <Text style={styles.sectionDesc}>
                Backup your identity and all game data to a file. You can restore it later or on another device.
              </Text>
              
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, backingUp && styles.buttonDisabled]}
                onPress={handleCreateBackup}
                disabled={backingUp}
              >
                {backingUp ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Create Backup</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Import Backup Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Import Backup</Text>
              <Text style={styles.sectionDesc}>
                Restore from a backup file (e.g., from another device)
              </Text>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, restoring && styles.buttonDisabled]}
                onPress={handleImportBackup}
                disabled={restoring}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color="#D4A017" />
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={20} color="#D4A017" style={{ marginRight: 8 }} />
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Import from File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Existing Backups Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Existing Backups</Text>
              
              {loading ? (
                <ActivityIndicator size="small" color="#D4A017" style={{ marginTop: 20 }} />
              ) : backups.length === 0 ? (
                <Text style={styles.emptyText}>No backups found</Text>
              ) : (
                backups.map((backup, index) => (
                  <View key={index} style={styles.backupItem}>
                    <View style={styles.backupInfo}>
                      <Text style={styles.backupFilename}>{backup.filename}</Text>
                      <Text style={styles.backupMeta}>
                        {formatDate(backup.timestamp)} • {formatSize(backup.size)}
                      </Text>
                    </View>
                    <View style={styles.backupActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => shareBackup(backup.path)}
                      >
                        <Ionicons name="share-outline" size={20} color="#D4A017" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRestore(backup.path)}
                      >
                        <Ionicons name="refresh-outline" size={20} color="#D4A017" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(backup.path, backup.filename)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#E91E63" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ⚠️ Keep your backups secure! They contain your identity and game data.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF8E7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#D4A017',
    borderColor: '#D4A017',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderColor: '#D4A017',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButtonText: {
    color: '#D4A017',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0D5C0',
  },
  backupInfo: {
    flex: 1,
  },
  backupFilename: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  backupMeta: {
    fontSize: 12,
    color: '#999',
  },
  backupActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0D5C0',
  },
  footerText: {
    fontSize: 12,
    color: '#E91E63',
    textAlign: 'center',
    lineHeight: 18,
  },
});
