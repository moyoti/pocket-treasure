import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { AchievementDefinition, UserAchievement, AchievementStatus, SeriesProgress, SeriesDefinition } from '@/src/p2p/types';
import { ACHIEVEMENT_DEFINITIONS, getAchievementById } from '@/src/p2p/data/achievements';
import { SERIES_DEFINITIONS } from '@/src/p2p/data/series';
import { CelebrationAnimation } from '@/components/animations/CelebrationAnimation';
import { TreasureSpinner } from '@/components/animations/TreasureSpinner';

type TabType = 'achievements' | 'series';

interface AchievementProgress {
  achievement: AchievementDefinition;
  progress: number;
  requirement: number;
  status: AchievementStatus;
  canClaim: boolean;
}

interface ClaimedAchievement {
  id: string;
  name: string;
  icon: string;
  rewards?: {
    coins?: number;
    experience?: number;
    title?: string;
  };
}

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { achievements, claimAchievement, refreshAchievements, refreshSeriesProgress, seriesProgress, claimSeriesReward, isInitialized } = useP2P();
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('achievements');
  const [claimedAchievement, setClaimedAchievement] = useState<ClaimedAchievement | null>(null);

  const achievementProgress: AchievementProgress[] = ACHIEVEMENT_DEFINITIONS.map(def => {
    const userAch = achievements.find(ua => ua.achievementId === def.id);
    return {
      achievement: def,
      progress: userAch?.progress || 0,
      requirement: def.requirement,
      status: userAch?.status || 'in_progress',
      canClaim: userAch?.status === 'completed' && !userAch?.claimedAt,
    };
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAchievements();
    await refreshSeriesProgress();
    setRefreshing(false);
  }, [refreshAchievements, refreshSeriesProgress]);

  const handleClaim = async (achievementId: string) => {
    const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    setClaimingId(achievementId);
    try {
      await claimAchievement(achievementId);
      if (achievement) {
        setClaimedAchievement({
          id: achievement.id,
          name: achievement.name,
          icon: achievement.icon || 'trophy',
          rewards: achievement.rewards,
        });
      }
    } catch (error) {
      console.error('Failed to claim achievement:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimSeries = async (seriesId: string, milestone: '25' | '50' | '75' | 'completion') => {
    setClaimingId(`${seriesId}-${milestone}`);
    try {
      await claimSeriesReward(seriesId, milestone);
    } catch (error) {
      console.error('Failed to claim series reward:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const categoryColors: Record<string, string> = {
    themed: '#3b82f6',
    rarity: '#9B59B6',
    location: '#22c55e',
    seasonal: '#D4A017',
    special: '#dc2626',
  };

  const renderSeriesItem = ({ item }: { item: SeriesProgress }) => {
    const seriesDef = SERIES_DEFINITIONS.find((s: SeriesDefinition) => s.id === item.seriesId);
    const progressPercent = item.progressPercent;
    const seriesName = seriesDef?.nameKey ? t(seriesDef.nameKey) : (item.seriesNameZh || item.seriesName);
    const canClaimMilestone = (milestone: '25' | '50' | '75' | 'completion') => {
      if (milestone === '25') return item.milestone25 && !item.rewardsClaimed.includes('25');
      if (milestone === '50') return item.milestone50 && !item.rewardsClaimed.includes('50');
      if (milestone === '75') return item.milestone75 && !item.rewardsClaimed.includes('75');
      if (milestone === 'completion') return item.isCompleted && !item.rewardsClaimed.includes('completion');
      return false;
    };

    return (
      <View style={[styles.card, item.isCompleted && styles.completedCard]}>
        <View style={[styles.colorBar, { backgroundColor: categoryColors[item.category] || '#8D99AE' }]} />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Ionicons name="layers" size={22} color={categoryColors[item.category] || '#8D99AE'} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.seriesNameZh || item.seriesName}</Text>
              <Text style={styles.description} numberOfLines={1}>
                {item.collectedItems.length} / {item.requiredItems.length} {t('series.items')}
              </Text>
            </View>
            {item.isCompleted && (
              <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{t('achievements.progress')}</Text>
              <Text style={styles.progressValue}>{Math.round(progressPercent)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: categoryColors[item.category] || '#8D99AE' },
                  item.isCompleted && { backgroundColor: '#22c55e' },
                ]}
              />
            </View>
          </View>

          <View style={styles.milestoneRow}>
            {item.milestone25 && (
              <TouchableOpacity
                style={[styles.milestoneChip, canClaimMilestone('25') && styles.milestoneClaimable]}
                onPress={() => handleClaimSeries(item.seriesId, '25')}
                disabled={!canClaimMilestone('25') || claimingId === `${item.seriesId}-25`}
              >
                <Text style={styles.milestoneText}>25%</Text>
              </TouchableOpacity>
            )}
            {item.milestone50 && (
              <TouchableOpacity
                style={[styles.milestoneChip, canClaimMilestone('50') && styles.milestoneClaimable]}
                onPress={() => handleClaimSeries(item.seriesId, '50')}
                disabled={!canClaimMilestone('50') || claimingId === `${item.seriesId}-50`}
              >
                <Text style={styles.milestoneText}>50%</Text>
              </TouchableOpacity>
            )}
            {item.milestone75 && (
              <TouchableOpacity
                style={[styles.milestoneChip, canClaimMilestone('75') && styles.milestoneClaimable]}
                onPress={() => handleClaimSeries(item.seriesId, '75')}
                disabled={!canClaimMilestone('75') || claimingId === `${item.seriesId}-75`}
              >
                <Text style={styles.milestoneText}>75%</Text>
              </TouchableOpacity>
            )}
            {item.isCompleted && seriesDef?.rewards?.completion && (
              <TouchableOpacity
                style={[styles.milestoneChip, styles.milestoneCompletion, canClaimMilestone('completion') && styles.milestoneClaimable]}
                onPress={() => handleClaimSeries(item.seriesId, 'completion')}
                disabled={!canClaimMilestone('completion') || claimingId === `${item.seriesId}-completion`}
              >
                {claimingId === `${item.seriesId}-completion` ? (
                  <TreasureSpinner size={16} color="#FFF" showParticles={false} />
                ) : (
                  <Text style={styles.milestoneText}>{t('series.complete')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <TreasureSpinner size={56} showText />
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = achievements.filter(a => a.status === 'claimed').length;
  const canClaimCount = achievementProgress.filter(a => a.canClaim).length;

  const tierColors: Record<number, string> = {
    1: '#8D99AE',
    2: '#3b82f6',
    3: '#9B59B6',
    4: '#D4A017',
  };

  // Map achievement icon names to Ionicons
  const getAchievementIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      // Collection tier icons
      'collection_tier1': 'diamond-outline',
      'collection_tier2': 'diamond',
      'collection_tier3': 'cube-outline',
      'collection_tier4': 'cube',
      'collection_tier5': 'trophy',
      // Rare collection icons
      'rare_first': 'sparkles-outline',
      'rare_hunter': 'sparkles',
      // Epic collection icons
      'epic_first': 'star-outline',
      'epic_hunter': 'star',
      // Legendary collection icons
      'legendary_first': 'flame-outline',
      'legendary_hunter': 'flame',
      // Streak icons
      'streak_week': 'calendar-outline',
      'streak_month': 'calendar',
      'streak_100': 'infinite',
      // Distance icons
      'distance_tier1': 'walk-outline',
      'distance_tier2': 'walk',
      'distance_tier3': 'bicycle-outline',
      'distance_tier4': 'bicycle',
      // Special icons
      'special_night': 'moon-outline',
      'special_lucky': 'luck-outline',
    };
    return iconMap[iconName] || 'trophy-outline';
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
            <Ionicons name={getAchievementIcon(ach.icon)} size={28} color={tierColors[ach.tier] || '#8D99AE'} />
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
              <Text style={styles.progressLabel}>{t('achievements.progress')}</Text>
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
                    <TreasureSpinner size={20} color="#FFF" showParticles={false} />
                  ) : (
                    <Text style={styles.claimButtonText}>{t('achievements.claimReward')}</Text>
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
        <Text style={styles.title}>{t('achievements.title')}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'achievements' && styles.tabButtonActive]}
          onPress={() => setActiveTab('achievements')}
        >
          <Ionicons 
            name={activeTab === 'achievements' ? 'trophy' : 'trophy-outline'} 
            size={18} 
            color={activeTab === 'achievements' ? '#D4A017' : '#AAA'} 
          />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
            {t('achievements.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'series' && styles.tabButtonActive]}
          onPress={() => setActiveTab('series')}
        >
          <Ionicons 
            name={activeTab === 'series' ? 'layers' : 'layers-outline'} 
            size={18} 
            color={activeTab === 'series' ? '#D4A017' : '#AAA'} 
          />
          <Text style={[styles.tabText, activeTab === 'series' && styles.tabTextActive]}>
            {t('series.title')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'achievements' && (
        <>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>{t('achievements.overallProgress')}</Text>
                <Text style={styles.statsValue}>{completedCount} / {achievementProgress.length}</Text>
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
                    width: `${achievementProgress.length > 0 ? (completedCount / achievementProgress.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <FlatList
            data={achievementProgress.filter(ap => !ap.achievement.isHidden)}
            keyExtractor={(item) => item.achievement.id}
            renderItem={renderAchievementItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="medal-outline" size={40} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>{t('achievements.noAchievements')}</Text>
                <Text style={styles.emptySubtext}>{t('achievements.startCollecting')}</Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'series' && (
        <>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>{t('series.completedSeries')}</Text>
                <Text style={styles.statsValue}>
                  {seriesProgress.filter(s => s.isCompleted).length} / {seriesProgress.length}
                </Text>
              </View>
              <View style={styles.statsIconCircle}>
                <Ionicons name="layers" size={24} color="#3b82f6" />
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: '#3b82f6' },
                  {
                    width: `${seriesProgress.length > 0 ? (seriesProgress.filter(s => s.isCompleted).length / seriesProgress.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <FlatList
            data={seriesProgress.filter(s => !SERIES_DEFINITIONS.find((d: SeriesDefinition) => d.id === s.seriesId)?.isHidden)}
            keyExtractor={(item) => item.seriesId}
            renderItem={renderSeriesItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="layers-outline" size={40} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>{t('series.noSeries')}</Text>
                <Text style={styles.emptySubtext}>{t('series.startCollecting')}</Text>
              </View>
            }
          />
        </>
      )}

      <CelebrationAnimation
        visible={!!claimedAchievement}
        achievementName={claimedAchievement?.name || ''}
        achievementIcon={claimedAchievement?.icon}
        rewards={claimedAchievement?.rewards}
        onClose={() => setClaimedAchievement(null)}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 6,
  },
  tabButtonActive: {
    borderColor: '#D4A017',
    backgroundColor: '#FFF8E7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
  },
  tabTextActive: {
    color: '#D4A017',
  },
  completedCard: {
    borderColor: '#22c55e',
    borderWidth: 1.5,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  milestoneChip: {
    backgroundColor: '#F5F0E5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  milestoneClaimable: {
    backgroundColor: '#D4A017',
  },
  milestoneCompletion: {
    backgroundColor: '#22c55e',
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
});