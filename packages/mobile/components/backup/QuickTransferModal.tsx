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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { QRCodeDisplay, QRCodeScanner } from '@/components/qr';
import * as FileSystem from 'expo-file-system';
import { backupService } from '@/src/p2p/identity/BackupService';

interface QuickTransferModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickTransferModal({
  visible,
  onClose,
}: QuickTransferModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'send' | 'receive' | null>(null);
  const [backups, setBackups] = useState<Array<{ filename: string; path: string; timestamp: number }>>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && mode === 'send') {
      loadBackups();
    }
  }, [visible, mode]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupList = await backupService.listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('[QuickTransfer] Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (backupPath: string) => {
    try {
      setLoading(true);
      // 读取备份文件
      const backupJson = await FileSystem.readAsStringAsync(backupPath);
      
      // 压缩并编码为 Base64（简化版，实际应该压缩）
      const encoded = btoa(backupJson);
      
      // 如果数据太大，分段显示
      if (encoded.length > 2000) {
        Alert.alert(
          'Large Backup',
          'This backup is too large for QR code. Please use file sharing instead.',
          [{ text: 'OK' }]
        );
        return;
      }

      setBackupData(encoded);
      setSelectedBackup(backupPath);
    } catch (error) {
      console.error('[QuickTransfer] Failed to read backup:', error);
      Alert.alert(t('common.error'), 'Failed to read backup');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = (data: string) => {
    try {
      // 解码 Base64
      const backupJson = atob(data);
      
      // 验证 JSON 格式
      const backup = JSON.parse(backupJson);
      
      if (!backup.version || !backup.timestamp) {
        throw new Error('Invalid backup format');
      }

      // 保存备份
      const filename = `treasurecat_backup_imported_${Date.now()}.json`;
      const backupPath = FileSystem.documentDirectory + 'backups/' + filename;
      
      FileSystem.writeAsStringAsync(backupPath, backupJson);
      
      Alert.alert(
        t('common.success'),
        'Backup received! You can now restore it from the backup list.',
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setMode(null);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('[QuickTransfer] Failed to process backup:', error);
      Alert.alert(t('common.error'), 'Invalid backup data');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Quick Transfer</Text>
            <TouchableOpacity onPress={() => { setMode(null); onClose(); }}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {!mode ? (
            // Mode Selection
            <View style={styles.modeSelection}>
              <Text style={styles.modeDesc}>
                Transfer backup to another device using QR code or clipboard
              </Text>

              <TouchableOpacity
                style={[styles.modeButton, styles.sendButton]}
                onPress={() => setMode('send')}
              >
                <Ionicons name="qr-code-outline" size={32} color="#FFF" />
                <Text style={styles.modeButtonText}>Send Backup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, styles.receiveButton]}
                onPress={() => setMode('receive')}
              >
                <Ionicons name="scan-outline" size={32} color="#D4A017" />
                <Text style={[styles.modeButtonText, styles.receiveButtonText]}>Receive Backup</Text>
              </TouchableOpacity>
            </View>
          ) : mode === 'send' ? (
            // Send Mode
            <ScrollView style={styles.content}>
              {!selectedBackup ? (
                <>
                  <Text style={styles.sectionTitle}>Select Backup</Text>
                  {loading ? (
                    <ActivityIndicator size="large" color="#D4A017" style={{ marginTop: 20 }} />
                  ) : backups.length === 0 ? (
                    <Text style={styles.emptyText}>No backups found</Text>
                  ) : (
                    backups.map((backup, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.backupItem}
                        onPress={() => handleSend(backup.path)}
                      >
                        <View style={styles.backupInfo}>
                          <Text style={styles.backupFilename}>{backup.filename}</Text>
                          <Text style={styles.backupMeta}>{formatDate(backup.timestamp)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Show QR Code</Text>
                  <Text style={styles.instructions}>
                    Ask the other device to scan this QR code
                  </Text>

                  <View style={styles.qrContainer}>
                    <QRCodeDisplay
                      visible={true}
                      onClose={() => {}}
                      value={backupData}
                      title="Backup Data"
                      size={250}
                    />
                  </View>

                  <Text style={styles.tipText}>
                    💡 Tip: Keep devices close for better scanning
                  </Text>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setSelectedBackup(null);
                      setBackupData('');
                    }}
                  >
                    <Text style={styles.backButtonText}>← Select Another Backup</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          ) : (
            // Receive Mode - QR Scanner Only
            <View style={styles.receiveContent}>
              <Text style={styles.sectionTitle}>Scan QR Code</Text>
              <Text style={styles.instructions}>
                Point your camera at the QR code shown on the other device
              </Text>

              <QRCodeScanner
                visible={true}
                onClose={() => setMode(null)}
                onScan={handleReceive}
                title="Scan Backup QR"
              />

              <View style={styles.receiveTip}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.receiveTipText}>
                  Make sure the QR code is clearly visible and well-lit
                </Text>
              </View>
            </View>
          )}
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
  modeSelection: {
    padding: 20,
  },
  modeDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  sendButton: {
    backgroundColor: '#D4A017',
  },
  receiveButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#D4A017',
  },
  modeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  receiveButtonText: {
    color: '#D4A017',
  },
  content: {
    padding: 20,
  },
  receiveContent: {
    padding: 20,
    alignItems: 'center',
  },
  receiveTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  receiveTipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D5C0',
  },
  backupInfo: {
    flex: 1,
  },
  backupFilename: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  backupMeta: {
    fontSize: 13,
    color: '#999',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 15,
    color: '#666',
  },
});
