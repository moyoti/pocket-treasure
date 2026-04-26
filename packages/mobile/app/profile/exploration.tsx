import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useP2P } from '@/src/p2p/P2PContext';
import { VisitedArea } from '@/src/p2p/types';
import { AREAS } from '@/src/p2p/data/areas';

export default function ExplorationScreen() {
  const { t } = useTranslation();
  const {
    visitedAreas,
    areaUnlockProgress,
    startAreaTracking,
    stopAreaTracking,
    checkAreaUnlock,
    refreshVisitedAreas,
    isInitialized,
    userLocation,
  } = useP2P();

  const [refreshing, setRefreshing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [checkingArea, setCheckingArea] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshVisitedAreas();
    setRefreshing(false);
  }, [refreshVisitedAreas]);

  const handleStartTracking = async () => {
    if (!userLocation) return;
    setIsTracking(true);
    await startAreaTracking();
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    stopAreaTracking();
  };

  const handleCheckUnlock = async (areaId: string) => {
    setCheckingArea(areaId);
    try {
      const unlocked = await checkAreaUnlock(areaId);
      if (unlocked) {
        await refreshVisitedAreas();
      }
    } finally {
      setCheckingArea(null);
    }
  };

  const getAreaStatus = (areaId: string): {
    visited: boolean;
    unlocked: boolean;
    visitCount: number;
    lastVisit: number | null;
  } => {
    const visited = visitedAreas.find(v => v.areaId === areaId);
    return {
      visited: !!visited,
      unlocked: visited?.isUnlocked || false,
      visitCount: visited?.visitCount || 0,
      lastVisit: visited?.lastVisitAt || null,
    };
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }

  const renderAreaItem = ({ item }: { item: typeof AREAS[0] }) => {
    const status = getAreaStatus(item.id);
    const progressPercent = status.unlocked ? 100 : 
      (status.visitCount / (item.unlockConditions?.minVisitCount || 1)) * 100;

    return (
      <View style={[styles.card, status.unlocked && styles.unlockedCard]}>
        <View style={[styles.colorBar, { backgroundColor: status.unlocked ? '#22c55e' : '#3b82f6' }]} />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Ionicons 
              name={status.unlocked ? 'checkmark-circle' : 'location-outline'} 
              size={22} 
              color={status.unlocked ? '#22c55e' : '#3b82f6'} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.description} numberOfLines={1}>
                {status.unlocked ? t('exploration.areaUnlocked') : 
                  status.visited ? `${t('exploration.visitCount')}: ${status.visitCount}` : 
                  t('exploration.notVisited')}
              </Text>
            </View>
            {!status.unlocked && status.visited && (
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => handleCheckUnlock(item.id)}
                disabled={checkingArea === item.id}
              >
                {checkingArea === item.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.unlockButtonText}>{t('exploration.tryUnlock')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{t('achievements.progress')}</Text>
              <Text style={styles.progressValue}>
                {status.visitCount} / {item.unlockConditions?.minVisitCount || 1}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: status.unlocked ? '#22c55e' : '#3b82f6' },
                ]}
              />
            </View>
          </View>

          {item.rewards && status.unlocked && (
            <View style={styles.rewardsRow}>
              <View style={styles.rewardChip}>
                <Ionicons name="cash-outline" size={14} color="#D4A017" />
                <Text style={styles.rewardText}>{item.rewards.coins}</Text>
              </View>
              <View style={styles.rewardChip}>
                <Ionicons name="star-outline" size={14} color="#9B59B6" />
                <Text style={styles.rewardText}>{item.rewards.experience}</Text>
              </View>
              {item.rewards.title && (
                <View style={styles.titleReward}>
                  <Text style={styles.titleRewardText}>{item.rewards.title}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('exploration.title')}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{areaUnlockProgress.unlocked}</Text>
            <Text style={styles.statLabel}>{t('exploration.unlockedAreas')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="map-outline" size={20} color="#D4A017" />
            <Text style={styles.statValue}>{areaUnlockProgress.total}</Text>
            <Text style={styles.statLabel}>{t('exploration.totalAreas')}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: '#3b82f6' },
              {
                width: `${areaUnlockProgress.total > 0 ? (areaUnlockProgress.unlocked / areaUnlockProgress.total) * 100 : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.trackingSection}>
        <TouchableOpacity
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
        >
          <Ionicons
            name={isTracking ? 'stop-circle' : 'navigate'}
            size={20}
            color={isTracking ? '#dc2626' : '#D4A017'}
          />
          <Text style={[styles.trackingButtonText, isTracking && styles.trackingButtonTextActive]}>
            {isTracking ? t('exploration.stopTracking') : t('exploration.startTracking')}
          </Text>
        </TouchableOpacity>
        {isTracking && (
          <Text style={styles.trackingStatus}>{t('exploration.tracking')}</Text>
        )}
      </View>

      <FlatList
        data={AREAS}
        keyExtractor={(item) => item.id}
        renderItem={renderAreaItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="map-outline" size={40} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>{t('exploration.noAreas')}</Text>
          </View>
        }
      />
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
    paddingVertical: 60,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5E5',
  },
  trackingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D4A017',
    gap: 8,
  },
  trackingButtonActive: {
    borderColor: '#dc2626',
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A017',
  },
  trackingButtonTextActive: {
    color: '#dc2626',
  },
  trackingStatus: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  unlockedCard: {
    borderColor: '#22c55e',
    borderWidth: 1.5,
  },
  colorBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  unlockButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  unlockButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  progressSection: {
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0E8D8',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAFAF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  titleReward: {
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  titleRewardText: {
    fontSize: 11,
    color: '#9B59B6',
    fontWeight: '600',
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
  },
});