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
import { useP2P } from '@/src/p2p';
import { backupService } from '@/src/p2p/identity/BackupService';

interface BackupMnemonicModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function BackupMnemonicModal({
  visible,
  onClose,
  onComplete,
}: BackupMnemonicModalProps) {
  const { t } = useTranslation();
  const { identity } = useP2P();
  
  const [mnemonic, setMnemonic] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (visible) {
      loadMnemonic();
    }
  }, [visible]);

  const loadMnemonic = async () => {
    try {
      const { identityService } = await import('@/src/p2p/identity/IdentityService');
      let stored = await identityService.getStoredMnemonic();
      
      console.log('[BackupModal] Loaded mnemonic:', stored ? 'exists' : 'null');
      
      if (stored) {
        setMnemonic(stored);
      } else {
        // Generate new mnemonic
        console.log('[BackupModal] Generating new mnemonic...');
        const newMnemonic = await identityService.generateAndSaveMnemonic();
        console.log('[BackupModal] Generated mnemonic:', newMnemonic ? 'success' : 'failed');
        setMnemonic(newMnemonic);
      }
    } catch (error) {
      // Silently handle error and generate new mnemonic
      try {
        console.log('[BackupModal] Error loading, generating new mnemonic...');
        const { identityService } = await import('@/src/p2p/identity/IdentityService');
        const newMnemonic = await identityService.generateAndSaveMnemonic();
        console.log('[BackupModal] Generated mnemonic:', newMnemonic ? 'success' : 'failed');
        setMnemonic(newMnemonic);
      } catch (fallbackError) {
        console.error('[BackupModal] Failed to generate mnemonic:', fallbackError);
        Alert.alert(t('common.error'), t('backup.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!mnemonic) return;
    
    setCreatingBackup(true);
    try {
      // Just validate the mnemonic and mark as backed up
      const isValid = await backupService.validateMnemonic(mnemonic);
      
      if (!isValid) {
        Alert.alert(t('common.error'), 'Invalid mnemonic');
        return;
      }
      
      // Mark as backed up
      const { identityService } = await import('@/src/p2p/identity/IdentityService');
      await identityService.markMnemonicBackedUp();
      
      Alert.alert(
        t('common.success'),
        t('backup.createSuccess'),
        [{ text: t('common.ok'), onPress: onComplete }]
      );
    } catch (error) {
      console.error('Backup failed:', error);
      Alert.alert(t('common.error'), t('backup.createFailed'));
    } finally {
      setCreatingBackup(false);
    }
  };

  const words = mnemonic.split(' ');

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('backup.backupIdentity')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Warning */}
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={24} color="#DC2626" />
              <Text style={styles.warningText}>{t('backup.warning')}</Text>
            </View>

            {/* Instructions */}
            <Text style={styles.instructions}>{t('backup.instructions')}</Text>

            {/* Mnemonic Words */}
            <View style={styles.wordGrid}>
              {words.map((word, index) => (
                <View key={index} style={styles.wordItem}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.word}>{word}</Text>
                </View>
              ))}
            </View>

            {/* Confirmation */}
            <TouchableOpacity
              style={[styles.checkbox, confirmed && styles.checkboxChecked]}
              onPress={() => setConfirmed(!confirmed)}
            >
              <Ionicons
                name={confirmed ? 'checkbox' : 'square-outline'}
                size={20}
                color={confirmed ? '#D4A017' : '#999'}
              />
              <Text style={styles.checkboxText}>{t('backup.confirmBackup')}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>{t('common.later')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (!confirmed || creatingBackup) && styles.buttonDisabled,
              ]}
              onPress={handleCreateBackup}
              disabled={!confirmed || creatingBackup}
            >
              {creatingBackup ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{t('backup.createBackup')}</Text>
              )}
            </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
  instructions: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0D5C0',
    minWidth: '30%',
  },
  wordNumber: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
  },
  word: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  checkboxChecked: {
    gap: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0D5C0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0D5C0',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#D4A017',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
});
