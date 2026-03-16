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
import {
  getDailyTasks,
  claimTaskReward,
  refreshDailyTasks,
  getUserAchievements,
  claimAchievementReward,
} from '@/lib/api';
import {
  DailyTask,
  DailyTaskStats,
  AchievementProgress,
  TaskStatus,
} from '@/types';

type TabType = 'tasks' | 'achievements';

const TASK_ICONS: Record<string, string> = {
  login: 'key-outline',
  collect: 'diamond-outline',
  visit_poi: 'location-outline',
  collect_rarity: 'star-outline',
};

const TASK_NAMES: Record<string, string> = {
  login: 'Daily Login',
  collect: 'Collect Treasures',
  visit_poi: 'Visit Locations',
  collect_rarity: 'Rare Collection',
};

export default function TasksScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskStats, setTaskStats] = useState<DailyTaskStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getDailyTasks();
      setTasks(data.tasks || []);
      setTaskStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      const data = await getUserAchievements();
      setAchievements(data || []);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTasks(), fetchAchievements()]);
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchAchievements]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleClaimTask = async (taskId: string) => {
    setClaimingId(taskId);
    try {
      await claimTaskReward(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('Failed to claim task:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimAchievement = async (achievementId: string) => {
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

  const handleRefreshTasks = async () => {
    try {
      await refreshDailyTasks();
      await fetchTasks();
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  };

  const renderTaskItem = ({ item }: { item: DailyTask }) => {
    const progressPercent = Math.min((item.currentProgress / item.targetProgress) * 100, 100);
    const isCompleted = item.status === 'completed';
    const isClaimed = item.status === 'claimed';

    return (
      <View style={[styles.taskCard, isCompleted && !isClaimed && styles.claimableCard]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <View style={[styles.taskIconContainer, isClaimed && styles.taskIconClaimed]}>
              <Ionicons
                name={(TASK_ICONS[item.taskType] || 'flag-outline') as any}
                size={20}
                color={isClaimed ? '#22c55e' : '#D4A017'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskName}>{TASK_NAMES[item.taskType] || item.taskType}</Text>
              {item.rarityRequirement && (
                <Text style={styles.rarityRequirement}>Requires: {item.rarityRequirement}</Text>
              )}
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            isClaimed && styles.claimedStatusBadge,
            isCompleted && !isClaimed && styles.completedStatusBadge,
          ]}>
            <Text style={[
              styles.statusText,
              isClaimed && styles.claimedStatusText,
              isCompleted && !isClaimed && styles.completedStatusText,
            ]}>
              {isClaimed ? 'Claimed' : isCompleted ? 'Claim' : 'In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{item.currentProgress} / {item.targetProgress}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${progressPercent}%` },
              isClaimed && styles.claimedProgress,
              isCompleted && !isClaimed && styles.completedProgress,
            ]} />
          </View>
        </View>

        <View style={styles.rewardsRow}>
          <View style={styles.rewardsGroup}>
            <View style={styles.rewardChip}>
              <Ionicons name="cash-outline" size={14} color="#D4A017" />
              <Text style={styles.rewardText}>{item.rewards.coins}</Text>
            </View>
            <View style={styles.rewardChip}>
              <Ionicons name="star-outline" size={14} color="#9B59B6" />
              <Text style={styles.rewardText}>{item.rewards.experience} EXP</Text>
            </View>
          </View>

          {isCompleted && !isClaimed && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => handleClaimTask(item.id)}
              disabled={claimingId === item.id}
            >
              {claimingId === item.id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.claimButtonText}>Claim</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderAchievementItem = ({ item }: { item: AchievementProgress }) => {
    const { achievement: ach, progress, requirement, status, canClaim } = item;
    const progressPercent = Math.min((progress / requirement) * 100, 100);
    const isClaimed = status === 'claimed';
    const isCompleted = status === 'completed' || progress >= requirement;

    const tierColors: Record<number, string> = {
      1: '#8D99AE',
      2: '#3b82f6',
      3: '#9B59B6',
      4: '#D4A017',
    };

    return (
      <View style={[styles.achievementCard, canClaim && styles.claimableCard]}>
        <View style={[styles.achievementColorBar, { backgroundColor: tierColors[ach.tier] || '#8D99AE' }]} />
        <View style={styles.achievementContent}>
          <View style={styles.achievementTitleRow}>
            <Text style={styles.achievementIcon}>{ach.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.achievementName}>{ach.name}</Text>
              <Text style={styles.achievementDescription} numberOfLines={2}>{ach.description}</Text>
            </View>
            {isClaimed && (
              <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{progress} / {requirement}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: tierColors[ach.tier] || '#8D99AE' },
                isCompleted && { backgroundColor: '#22c55e' },
              ]} />
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
                    <Text style={styles.titleText}>{ach.rewards.title}</Text>
                  </View>
                )}
              </View>

              {(canClaim || isCompleted) && !isClaimed && (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleClaimAchievement(ach.id)}
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'claimed').length;
  const completedAchievements = achievements.filter((a) => a.status === 'claimed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quests</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Ionicons
            name="flag-outline"
            size={16}
            color={activeTab === 'tasks' ? '#1A1A1A' : '#AAA'}
          />
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            Daily Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Ionicons
            name="medal-outline"
            size={16}
            color={activeTab === 'achievements' ? '#1A1A1A' : '#AAA'}
          />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'tasks' ? (
        <>
          {/* Stats Card */}
          {taskStats && (
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Today's Progress</Text>
                  <Text style={styles.statsValue}>
                    {taskStats.todayCompleted} / {taskStats.todayTotal}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshIconButton}
                  onPress={handleRefreshTasks}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="refresh" size={20} color="#D4A017" />
                </TouchableOpacity>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        taskStats.todayTotal > 0
                          ? (taskStats.todayCompleted / taskStats.todayTotal) * 100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="flag-outline" size={40} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>No daily tasks</Text>
                <Text style={styles.emptySubtext}>Check back tomorrow for new tasks</Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>Achievement Progress</Text>
                <Text style={styles.statsValue}>
                  {completedAchievements} / {achievements.length}
                </Text>
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
                    width: `${
                      achievements.length > 0
                        ? (completedAchievements / achievements.length) * 100
                        : 0
                    }%`,
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
                <Text style={styles.emptyText}>No achievements</Text>
                <Text style={styles.emptySubtext}>Start collecting treasures to unlock achievements</Text>
              </View>
            }
          />
        </>
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
    paddingVertical: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F5F0E5',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
  },
  activeTabText: {
    color: '#1A1A1A',
    fontWeight: '700',
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
  refreshIconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFF8E7',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  // Task Card
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
  },
  claimableCard: {
    borderColor: '#D4A017',
    borderWidth: 1.5,
  },
  taskHeader: {
    padding: 14,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskIconClaimed: {
    backgroundColor: '#F0FDF4',
  },
  taskName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rarityRequirement: {
    fontSize: 11,
    color: '#9B59B6',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0F4F8',
  },
  completedStatusBadge: {
    backgroundColor: '#FFF8E7',
  },
  claimedStatusBadge: {
    backgroundColor: '#F0FDF4',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
  },
  completedStatusText: {
    color: '#D4A017',
  },
  claimedStatusText: {
    color: '#22c55e',
  },
  progressSection: {
    padding: 14,
    paddingBottom: 8,
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
    backgroundColor: '#D4A017',
    borderRadius: 3,
  },
  completedProgress: {
    backgroundColor: '#D4A017',
  },
  claimedProgress: {
    backgroundColor: '#22c55e',
  },
  rewardsRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
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
  titleText: {
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
  // Achievement Card
  achievementCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  achievementColorBar: {
    width: 4,
  },
  achievementContent: {
    flex: 1,
    padding: 14,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
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
