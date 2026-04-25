import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { TradeSession, TradeOffer, InventoryItem, ItemRarity } from '@/src/p2p/types';
import { TradeItemSelection } from './TradeItemSelection';
import { RARITY_COLORS } from '@/src/p2p/types';

interface TradeNegotiationModalProps {
  session: TradeSession;
  onClose: () => void;
}

export function TradeNegotiationModal({ session, onClose }: TradeNegotiationModalProps) {
  const { t } = useTranslation();
  const {
    inventory,
    identity,
    sendTradeOffer,
    acceptTradeOffer,
    rejectTradeOffer,
    executeTrade,
    cancelTrade,
    disconnectTrade,
  } = useP2P();

  const [mySelectedItems, setMySelectedItems] = useState<string[]>([]);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const statusColor = {
    discovering: '#999',
    connecting: '#3b82f6',
    negotiating: '#D4A017',
    exchanging: '#9B59B6',
    completed: '#22c55e',
    failed: '#dc2626',
    cancelled: '#999',
  };

  const statusIcon = {
    discovering: 'search',
    connecting: 'link',
    negotiating: 'hand-left',
    exchanging: 'swap-horizontal',
    completed: 'checkmark-circle',
    failed: 'close-circle',
    cancelled: 'ban',
  };

  const handleSendOffer = async () => {
    if (mySelectedItems.length === 0) {
      Alert.alert(t('common.error'), t('trade.noItemsSelected'));
      return;
    }

    const selectedInventoryItems = inventory.filter(item => mySelectedItems.includes(item.id));
    const offer: TradeOffer = {
      offerId: `offer-${Date.now()}`,
      offererPublicKey: identity?.publicKey || '',
      offererDisplayName: identity?.displayName || 'Trader',
      offeredItems: selectedInventoryItems.map(item => ({
        inventoryId: item.id,
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000, // 1 minute expiry
    };

    await sendTradeOffer(offer);
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptTradeOffer();
    } catch (error) {
      console.error('Failed to accept:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    await rejectTradeOffer();
    onClose();
  };

  const handleConfirmTrade = async () => {
    setIsExecuting(true);
    try {
      // Generate signature
      const signature = `sig-${Date.now()}`; // Simplified for demo
      const record = await executeTrade(signature);
      if (record) {
        Alert.alert(t('trade.tradeComplete'), '', [
          { text: t('common.close'), onPress: onClose },
        ]);
      }
    } catch (error) {
      console.error('Trade execution failed:', error);
      Alert.alert(t('trade.tradeFailed'));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = async () => {
    await cancelTrade();
    onClose();
  };

  const getSelectedItemDetails = (inventoryId: string) => {
    return inventory.find(item => item.id === inventoryId);
  };

  const isNegotiating = session.status === 'negotiating';
  const canSendOffer = isNegotiating && !session.myOffer;
  const canAccept = isNegotiating && session.partnerOffer && !session.myOffer;
  const canConfirm = isNegotiating && session.myOffer && session.partnerOffer;

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Ionicons
              name={statusIcon[session.status] as any}
              size={16}
              color={statusColor[session.status]}
            />
            <Text style={[styles.statusText, { color: statusColor[session.status] }]}>
              {session.status}
            </Text>
          </View>
        </View>

        <View style={styles.partnerSection}>
          <View style={styles.partnerAvatar}>
            <Text style={styles.partnerAvatarText}>
              {session.partnerDisplayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.partnerName}>{session.partnerDisplayName}</Text>
          <Text style={styles.partnerKey}>
            {session.partnerPublicKey.slice(0, 8)}...{session.partnerPublicKey.slice(-8)}
          </Text>
        </View>

        <ScrollView style={styles.content}>
<View style={styles.offerSection}>
          <Text style={styles.offerTitle}>{t('trade.myOffer')}</Text>
            {session.myOffer ? (
              <View style={styles.offerCard}>
                {session.myOffer.offeredItems.map((item, idx) => {
                  const details = getSelectedItemDetails(item.inventoryId);
                  if (!details) return null;
                  return (
                    <View key={idx} style={styles.offerItem}>
                      <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS.legendary }]} />
                      <Text style={styles.offerItemName}>Item {item.itemId.slice(0, 8)}</Text>
                      <Text style={styles.offerItemQty}>x{item.quantity}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectItemsButton}
                onPress={() => setShowItemSelection(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#D4A017" />
                <Text style={styles.selectItemsText}>{t('trade.selectItems')}</Text>
              </TouchableOpacity>
            )}

            {mySelectedItems.length > 0 && !session.myOffer && (
              <View style={styles.selectedItemsPreview}>
                <Text style={styles.selectedItemsTitle}>
                  {t('trade.selectedItems')} ({mySelectedItems.length})
                </Text>
                <FlatList
                  data={mySelectedItems}
                  keyExtractor={(id) => id}
                  horizontal
                  renderItem={({ item: invId }) => {
                    const details = getSelectedItemDetails(invId);
                    if (!details) return null;
                    return (
                      <View style={styles.previewItem}>
                        <Text style={styles.previewItemText}>
                          {details.itemId.slice(0, 6)}
                        </Text>
                      </View>
                    );
                  }}
                />
                <TouchableOpacity
                  style={styles.sendOfferButton}
                  onPress={handleSendOffer}
                >
                  <Text style={styles.sendOfferButtonText}>{t('trade.sendOffer')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.offerSection}>
            <Text style={styles.offerTitle}>{t('trade.partnerOffer')}</Text>
            {session.partnerOffer ? (
              <View style={styles.offerCard}>
                {session.partnerOffer.offeredItems.map((item, idx) => (
                  <View key={idx} style={styles.offerItem}>
                    <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS.rare }]} />
                    <Text style={styles.offerItemName}>Item {item.itemId.slice(0, 8)}</Text>
                    <Text style={styles.offerItemQty}>x{item.quantity}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.waitingCard}>
                <ActivityIndicator size="small" color="#D4A017" />
                <Text style={styles.waitingText}>{t('trade.waitingForPartner')}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.actionsSection}>
          {canAccept && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
              >
                <Ionicons name="close-circle" size={20} color="#dc2626" />
                <Text style={styles.rejectButtonText}>{t('trade.reject')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.acceptButtonText}>{t('trade.accept')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {canConfirm && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmTrade}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="swap-horizontal" size={20} color="#FFF" />
                  <Text style={styles.confirmButtonText}>{t('trade.confirmTrade')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {session.status === 'completed' && (
            <View style={styles.completedSection}>
              <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              <Text style={styles.completedText}>{t('trade.tradeComplete')}</Text>
              <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
                <Text style={styles.closeModalButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showItemSelection && (
          <Modal visible={showItemSelection} animationType="slide" transparent={false}>
            <TradeItemSelection
              selectedItems={mySelectedItems}
              onSelectionChange={setMySelectedItems}
              onClose={() => setShowItemSelection(false)}
            />
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    padding: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  partnerSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  partnerKey: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  offerSection: {
    marginBottom: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  offerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  offerItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  offerItemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  selectItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D4A017',
    gap: 8,
  },
  selectItemsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D4A017',
  },
  selectedItemsPreview: {
    marginTop: 8,
  },
  selectedItemsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  previewItem: {
    backgroundColor: '#F5F0E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  previewItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sendOfferButton: {
    backgroundColor: '#D4A017',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  sendOfferButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 10,
  },
  waitingText: {
    fontSize: 14,
    color: '#999',
  },
  actionsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
  acceptButton: {
    backgroundColor: '#22c55e',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A017',
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  completedSection: {
    alignItems: 'center',
    padding: 20,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
    marginTop: 8,
  },
  closeModalButton: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  closeModalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});