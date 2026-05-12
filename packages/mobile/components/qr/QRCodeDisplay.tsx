import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  size?: number;
  logo?: any;
}

export function QRCodeDisplay({
  value,
  title,
  size = 200,
  logo,
}: QRCodeDisplayProps) {
  const { t } = useTranslation();
  const qrRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!qrRef.current) return;

    setIsSharing(true);
    try {
      // Generate QR code image
      qrRef.current.toDataURL((dataUrl: string) => {
        const imageUrl = `data:image/png;base64,${dataUrl}`;
        
        // Download to cache
        const localUri = `${FileSystem.cacheDirectory}profile_qr_${Date.now()}.png`;
        
        FileSystem.downloadAsync(imageUrl, localUri)
          .then(async () => {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(localUri, {
                mimeType: 'image/png',
                dialogTitle: t('profile.shareQR'),
              });
            } else {
              Alert.alert(t('common.error'), t('profile.sharingNotAvailable'));
            }
          })
          .catch((error) => {
            console.error('Failed to download QR:', error);
            Alert.alert(t('common.error'), t('common.tryAgain'));
          })
          .finally(() => {
            setIsSharing(false);
          });
      });
    } catch (error) {
      console.error('Share failed:', error);
      setIsSharing(false);
      Alert.alert(t('common.error'), t('common.tryAgain'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with share button */}
      <View style={styles.header}>
        {title && <Text style={styles.title}>{title}</Text>}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing}
        >
          <Ionicons
            name={isSharing ? 'hourglass-outline' : 'share-outline'}
            size={24}
            color="#D4A017"
          />
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <QRCode
          ref={qrRef}
          value={value}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
          logo={logo}
          logoSize={size * 0.2}
          logoBackgroundColor="transparent"
        />
      </View>

      {/* Value preview */}
      <View style={styles.valueContainer}>
        <Text style={styles.valueText} numberOfLines={1}>
          {value.slice(0, 16)}...{value.slice(-16)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  shareButton: {
    padding: 8,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0D5C0',
    marginBottom: 16,
  },
  valueContainer: {
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  valueText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
