import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p';
import { backupService } from '@/src/p2p/identity/BackupService';

interface RecoverMnemonicScreenProps {
  onRecoverComplete: () => void;
  onCancel: () => void;
}

export function RecoverMnemonicScreen({
  onRecoverComplete,
  onCancel,
}: RecoverMnemonicScreenProps) {
  const { t } = useTranslation();
  const { reloadApp } = useP2P();
  
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [recovering, setRecovering] = useState(false);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    // 只允许字母和空格，自动转小写
    const cleaned = value.toLowerCase().replace(/[^a-z\s]/g, '');
    newWords[index] = cleaned;
    setWords(newWords);
    
    // 自动跳转到下一个输入框（如果有空格）
    if (value.includes(' ') && index < 11) {
      const nextInput = document.getElementById(`word-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleRecover = async () => {
    const mnemonic = words.join(' ').trim();
    
    // 验证输入
    if (words.some(w => !w.trim())) {
      Alert.alert(t('common.error'), t('backup.enterAllWords'));
      return;
    }

    setRecovering(true);
    try {
      // 1. 从助记词恢复身份
      const { identityService } = await import('@/src/p2p/identity/IdentityService');
      await identityService.createIdentityFromMnemonic(mnemonic);
      
      // 2. 尝试恢复数据库备份
      const backupResult = await backupService.restoreBackup(mnemonic);
      
      if (backupResult.success) {
        Alert.alert(
          t('common.success'),
          t('backup.recoverSuccess'),
          [{ text: t('common.ok'), onPress: onRecoverComplete }]
        );
      } else {
        // 身份恢复成功，但数据备份不存在
        Alert.alert(
          t('common.success'),
          t('backup.identityRecovered'),
          [{ text: t('common.ok'), onPress: onRecoverComplete }]
        );
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('backup.recoverFailed')
      );
    } finally {
      setRecovering(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('backup.recoverIdentity')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="information-circle" size={20} color="#D4A017" />
        <Text style={styles.instructionsText}>
          {t('backup.recoverInstructions')}
        </Text>
      </View>

      {/* Word Inputs */}
      <View style={styles.wordInputs}>
        {words.map((word, index) => (
          <View key={index} style={styles.inputContainer}>
            <Text style={styles.inputNumber}>{index + 1}</Text>
            <TextInput
              id={`word-${index}`}
              style={styles.input}
              value={word}
              onChangeText={(value) => handleWordChange(index, value)}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              selectTextOnFocus
            />
          </View>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.button,
          recovering && styles.buttonDisabled,
        ]}
        onPress={handleRecover}
        disabled={recovering}
      >
        {recovering ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#FFF" />
            <Text style={styles.buttonText}>{t('backup.recoverIdentity')}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Warning */}
      <View style={styles.warning}>
        <Ionicons name="warning" size={16} color="#999" />
        <Text style={styles.warningText}>{t('backup.recoverWarning')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  wordInputs: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputNumber: {
    width: 30,
    fontSize: 14,
    color: '#999',
    textAlign: 'right',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0D5C0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A017',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
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
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#999',
  },
});
