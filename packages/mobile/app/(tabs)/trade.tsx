import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { NearbyTrader, TradeSession } from '@/src/p2p/types';
import { TradeNegotiationModal } from '@/components/trade/TradeNegotiationModal';
import { requestBluetoothPermission } from '@/components/trade/BluetoothPermission';

export default function TradeScreen() {
  const { t } = useTranslation();
  const {
    nearbyTraders,
    activeTrade,
    tradeHistory,
    startTradeDiscovery,
    stopTradeDiscovery,
    connectToTrader,
    isInitialized,
  } = useP2P();

  const [isScanning, setIsScanning] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [showNegotiation, setShowNegotiation] = useState(false);

  useEffect(() => {
    if (activeTrade && activeTrade.status !== 'discovering') {
      setShowNegotiation(true);
    }
  }, [activeTrade]);

  const handleStartScan = async () => {
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      Alert.alert(
        t('trade.permissionRequired'),
        t('trade.permissionDesc'),
        [{ text: t('common.close') }]
      );
      return;
    }

    try {
      setIsScanning(true);
      await startTradeDiscovery();
    } catch (error: any) {
      console.error('[Trade] Failed to start discovery:', error);
      setIsScanning(false);
      
      // Check if it's a Bluetooth not enabled error
      if (error.message && error.message.includes('Bluetooth is not enabled')) {
        Alert.alert(
          t('trade.bluetoothRequired'),
          t('trade.bluetoothRequiredDesc'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('trade.openBluetoothSettings'),
              onPress: async () => {
                try {
                  // Try to open Bluetooth settings
                  if (Platform.OS === 'ios') {
                    // iOS doesn't allow direct Bluetooth settings access
                    // Open app settings instead
                    await Linking.openURL('app-settings:');
                  } else {
                    // Android can open Bluetooth settings directly
                    await Linking.openURL('android.settings.BLUETOOTH_SETTINGS');
                  }
                } catch (err) {
                  console.error('[Trade] Failed to open settings:', err);
                  // Fallback: open general settings
                  await Linking.openSettings();
                }
              },
            },
          ]
        );
      } else {
        // Other errors
        Alert.alert(
          t('common.error'),
          error.message || t('trade.discoveryFailed')
        );
      }
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    stopTradeDiscovery();
  };

  const handleConnectTrader = async (trader: NearbyTrader) => {
    setConnectingTo(trader.deviceId);
    try {
      const session = await connectToTrader(trader.deviceId);
      if (session) {
        setShowNegotiation(true);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      Alert.alert(t('common.error'), t('trade.connectionFailed'));
    } finally {
      setConnectingTo(null);
    }
  };

  const handleCloseNegotiation = () => {
    setShowNegotiation(false);
  };

  const renderTraderItem = ({ item }: { item: NearbyTrader }) => {
    const isConnecting = connectingTo === item.deviceId;

    return (
      <TouchableOpacity
        style={styles.traderCard}
        onPress={() => handleConnectTrader(item)}
        disabled={isConnecting || !!activeTrade}
        activeOpacity={0.7}
      >
        <View style={styles.traderAvatar}>
          <Text style={styles.traderAvatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.traderInfo}>
          <Text style={styles.traderName}>{item.displayName}</Text>
          <Text style={styles.traderKey}>
            {item.publicKey.slice(0, 8)}...{item.publicKey.slice(-8)}
          </Text>
        </View>
        {isConnecting ? (
          <ActivityIndicator size="small" color="#D4A017" />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#D4A017" />
        )}
      </TouchableOpacity>
    );
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('trade.title')}</Text>
        <Text style={styles.subtitle}>
          {isScanning
            ? t('trade.scanning')
            : nearbyTraders.length > 0
              ? t('trade.nearbyPlayers')
              : t('trade.noPlayers')}
        </Text>
      </View>

      <View style={styles.scanSection}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          onPress={isScanning ? handleStopScan : handleStartScan}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isScanning ? 'stop-circle' : 'radio'}
            size={24}
            color="#FFF"
          />
          <Text style={styles.scanButtonText}>
            {isScanning ? t('trade.stopScan') : t('trade.startScan')}
          </Text>
        </TouchableOpacity>

        {isScanning && (
          <View style={styles.scanIndicator}>
            <ActivityIndicator size="small" color="#D4A017" />
            <Text style={styles.scanIndicatorText}>
              {nearbyTraders.length} {t('trade.nearbyPlayers')}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={nearbyTraders}
        keyExtractor={(item) => item.publicKey}
        renderItem={renderTraderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={40} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>{t('trade.noPlayers')}</Text>
              <Text style={styles.emptySubtext}>
                {t('trade.startScan')} {t('trade.nearbyPlayers')}
              </Text>
            </View>
          ) : null
        }
      />

      {tradeHistory.length > 0 && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => {
            Alert.alert(
              t('trade.tradeHistory'),
              `${tradeHistory.length} trades`,
              [{ text: t('common.close') }]
            );
          }}
        >
          <Ionicons name="time-outline" size={20} color="#D4A017" />
          <Text style={styles.historyButtonText}>{t('trade.tradeHistory')}</Text>
          <Text style={styles.historyCount}>{tradeHistory.length}</Text>
        </TouchableOpacity>
      )}

      {showNegotiation && activeTrade && (
        <TradeNegotiationModal
          session={activeTrade}
          onClose={handleCloseNegotiation}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#999',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 4,
  },
  scanSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A017',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  scanButtonActive: {
    backgroundColor: '#dc2626',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  scanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  scanIndicatorText: {
    fontSize: 13,
    color: '#666',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  traderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  traderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
  },
  traderAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  traderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  traderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  traderKey: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 8,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  historyCount: {
    fontSize: 13,
    color: '#D4A017',
    fontWeight: '700',
  },
});