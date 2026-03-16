import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserAchievements, claimAchievementReward } from '@/lib/api';
import { AchievementProgress, AchievementStatus } from '@/types';

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      const data = await getUserAchievements();
      setAchievements(data || []);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAchievements();
  };

  const handleClaim = async (achievementId: string) => {
    setClaimingId(achievementId);
    try {
      await claimAchievementReward(achievementId);
      await fetchAchievements();
    } catch (error) {
      console.error('Failed to claim achievement:', error);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = achievements.filter(a => a.status === 'claimed').length;
  const canClaimCount = achievements.filter(a => a.canClaim).length;

  const tierColors: Record<number, string> = {
    1: '#8D99AE',
    2: '#3b82f6',
    3: '#9B59B6',
    4: '#D4A017',
  };

  const renderAchievementItem = ({ item }: { item: AchievementProgress }) => {
    const { achievement: ach, progress, requirement, status, canClaim } = item;
    const progressPercent = Math.min((progress / requirement) * 100, 100);
    const isCompleted = status === 'completed' || progress >= requirement;
    const isClaimed = status === 'claimed';

    return (
      <View style={[styles.card, canClaim && styles.claimableCard]}>
        <View style={[styles.colorBar, { backgroundColor: tierColors[ach.tier] || '#8D99AE' }]} />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>{ach.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{ach.name}</Text>
              <Text style={styles.description} numberOfLines={2}>{ach.description}</Text>
            </View>
            {isClaimed && (
              <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            )}
            {canClaim && !isClaimed && (
              <View style={styles.canClaimDot} />
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{progress} / {requirement}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: tierColors[ach.tier] || '#8D99AE' },
                  isCompleted && { backgroundColor: '#22c55e' },
                ]}
              />
            </View>
          </View>

          {ach.rewards && (
            <View style={styles.rewardsRow}>
              <View style={styles.rewardsGroup}>
                <View style={styles.rewardChip}>
                  <Ionicons name="cash-outline" size={14} color="#D4A017" />
                  <Text style={styles.rewardText}>{ach.rewards.coins}</Text>
                </View>
                <View style={styles.rewardChip}>
                  <Ionicons name="star-outline" size={14} color="#9B59B6" />
                  <Text style={styles.rewardText}>{ach.rewards.experience}</Text>
                </View>
                {ach.rewards.title && (
                  <View style={styles.titleReward}>
                    <Text style={styles.titleRewardText}>{ach.rewards.title}</Text>
                  </View>
                )}
              </View>

              {(canClaim || isCompleted) && !isClaimed && (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleClaim(ach.id)}
                  disabled={claimingId === ach.id}
                >
                  {claimingId === ach.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.claimButtonText}>Claim</Text>
                  )}
                </TouchableOpacity>
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
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          {completedCount} of {achievements.length} completed
          {canClaimCount > 0 ? ` -- ${canClaimCount} to claim` : ''}
        </Text>
      </View>

      {/* Overall progress */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>Overall Progress</Text>
            <Text style={styles.statsValue}>{completedCount} / {achievements.length}</Text>
          </View>
          <View style={styles.statsIconCircle}>
            <Ionicons name="medal" size={24} color="#9B59B6" />
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: '#9B59B6' },
              {
                width: `${achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0}%`,
              },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={achievements}
        keyExtractor={(item) => item.achievement.id}
        renderItem={renderAchievementItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="medal-outline" size={40} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>No achievements yet</Text>
            <Text style={styles.emptySubtext}>Start collecting treasures to unlock achievements</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  statsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 0,
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
  claimableCard: {
    borderColor: '#D4A017',
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
  icon: {
    fontSize: 28,
    marginRight: 12,
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
  canClaimDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4A017',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsGroup: {
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
  claimButton: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
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
});
