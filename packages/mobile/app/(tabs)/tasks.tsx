import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useP2P } from '@/src/p2p/P2PContext';
import { DailyTaskDefinition, UserDailyTask, TaskStatus, TaskType, WeeklyMissionProgress } from '@/src/p2p/types';
import { DAILY_TASK_DEFINITIONS } from '@/src/p2p/data/dailyTasks';
import { WEEKLY_MISSION_DEFINITIONS, WeeklyMissionDefinition, MissionType } from '@/src/p2p/data/weeklyMissions';
import { getWeeklyMissionsProgress, claimWeeklyMissionReward } from '@/utils/weeklyMissions';

type TabType = 'tasks' | 'missions' | 'achievements';

const TASK_ICONS: Record<TaskType, string> = {
  login: 'key-outline',
  collect: 'diamond-outline',
  visit_poi: 'location-outline',
  collect_rarity: 'star-outline',
};

const MISSION_ICONS: Record<MissionType, string> = {
  visit_pois: 'map-outline',
  collect_rarity_items: 'star-outline',
  collect_total_items: 'cube-outline',
  explore_areas: 'compass-outline',
  complete_daily_tasks: 'calendar-outline',
  synthesize_items: 'construct-outline',
};

interface DailyTaskWithDefinition {
  userTask: UserDailyTask;
  definition: DailyTaskDefinition;
}

export default function TasksScreen() {
  const { t } = useTranslation();
  const { dailyTasks, achievements, claimDailyTask, claimAchievement, refreshDailyTasks, refreshAchievements, isInitialized } = useP2P();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [weeklyMissionProgress, setWeeklyMissionProgress] = useState<WeeklyMissionProgress[]>([]);

  const getTaskName = (taskType: TaskType): string => {
    const key = `tasks.taskTypes.${taskType}`;
    const translated = t(key);
    return translated === key ? taskType : translated;
  };

  const tasksWithDefinitions: DailyTaskWithDefinition[] = dailyTasks.map(ut => {
    const def = DAILY_TASK_DEFINITIONS.find(d => d.id === ut.taskDefinitionId);
    return { userTask: ut, definition: def! };
  }).filter(t => t.definition);

  const fetchData = useCallback(async () => {
    await refreshDailyTasks();
    await refreshAchievements();
    const progress = await getWeeklyMissionsProgress();
    setWeeklyMissionProgress(progress);
  }, [refreshDailyTasks, refreshAchievements]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleClaimTask = async (taskId: string) => {
    setClaimingId(taskId);
    try {
      await claimDailyTask(taskId);
    } catch (error) {
      console.error('Failed to claim task:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimMission = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      const progress = await claimWeeklyMissionReward(missionId);
      setWeeklyMissionProgress(progress);
    } catch (error) {
      console.error('Failed to claim mission:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimAchievement = async (achievementId: string) => {
    setClaimingId(achievementId);
    try {
      await claimAchievement(achievementId);
    } catch (error) {
      console.error('Failed to claim achievement:', error);
    } finally {
      setClaimingId(null);
    }
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

  const completedTasks = dailyTasks.filter((t) => t.status === 'completed' || t.status === 'claimed').length;
  const completedAchievements = achievements.filter((a) => a.status === 'claimed').length;

  const renderTaskItem = ({ item }: { item: DailyTaskWithDefinition }) => {
    const { userTask, definition } = item;
    const progressPercent = Math.min((userTask.currentProgress / definition.targetProgress) * 100, 100);
    const isCompleted = userTask.status === 'completed';
    const isClaimed = userTask.status === 'claimed';

    return (
      <View style={[styles.taskCard, isCompleted && !isClaimed && styles.claimableCard]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <View style={[styles.taskIconContainer, isClaimed && styles.taskIconClaimed]}>
              <Ionicons
                name={(TASK_ICONS[definition.taskType] || 'flag-outline') as any}
                size={20}
                color={isClaimed ? '#22c55e' : '#D4A017'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskName}>{getTaskName(definition.taskType)}</Text>
              {definition.rarityRequirement && (
                <Text style={styles.rarityRequirement}>
                  {t('tasks.rarityRequirement')}: {t(`rarity.${definition.rarityRequirement}`)}
                </Text>
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
              {isClaimed ? t('tasks.claimed') : isCompleted ? t('tasks.claim') : t('tasks.inProgress')}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{t('tasks.progress')}</Text>
            <Text style={styles.progressValue}>{userTask.currentProgress} / {definition.targetProgress}</Text>
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
              <Text style={styles.rewardText}>{definition.rewards.coins}</Text>
            </View>
            <View style={styles.rewardChip}>
              <Ionicons name="star-outline" size={14} color="#9B59B6" />
              <Text style={styles.rewardText}>{definition.rewards.experience} {t('tasks.exp')}</Text>
            </View>
          </View>

          {isCompleted && !isClaimed && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => handleClaimTask(definition.id)}
              disabled={claimingId === definition.id}
            >
              {claimingId === definition.id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.claimButtonText}>{t('tasks.claim')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tasks.title')}</Text>
      </View>

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
            {t('tasks.dailyTasks')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'missions' && styles.activeTab]}
          onPress={() => setActiveTab('missions')}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'missions' ? '#1A1A1A' : '#AAA'}
          />
          <Text style={[styles.tabText, activeTab === 'missions' && styles.activeTabText]}>
            {t('tasks.weeklyMissions')}
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
            {t('achievements.title')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' ? (
        <>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>{t('tasks.todayProgress')}</Text>
                <Text style={styles.statsValue}>
                  {completedTasks} / {dailyTasks.length}
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailyTasks.length > 0 ? (completedTasks / dailyTasks.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <FlatList
            data={tasksWithDefinitions}
            keyExtractor={(item) => item.userTask.id}
            renderItem={renderTaskItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="flag-outline" size={40} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>{t('tasks.noTasks')}</Text>
                <Text style={styles.emptySubtext}>{t('tasks.checkBackTomorrow')}</Text>
              </View>
            }
          />
        </>
      ) : activeTab === 'missions' ? (
        <>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>{t('tasks.weeklyMissions')}</Text>
                <Text style={styles.statsValue}>
                  {WEEKLY_MISSION_DEFINITIONS.length}
                </Text>
              </View>
              <View style={[styles.statsIconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="calendar" size={24} color="#F59E0B" />
              </View>
            </View>
          </View>

          <FlatList
            data={WEEKLY_MISSION_DEFINITIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const missionProgress = weeklyMissionProgress.find(p => p.missionId === item.id);
              const progressPercent = missionProgress 
                ? Math.min((missionProgress.currentProgress / item.targetProgress) * 100, 100) 
                : 0;
              
              return (
                <View style={styles.missionCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskTitleRow}>
                      <View style={[styles.taskIconContainer, { backgroundColor: '#FFF3E0' }]}>
                        <Ionicons
                          name={(MISSION_ICONS[item.missionType] || 'calendar-outline') as any}
                          size={20}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskName}>{item.name}</Text>
                        {item.rarityRequirement && (
                          <Text style={styles.rarityRequirement}>
                            {t('tasks.rarityRequirement')}: {t(`rarity.${item.rarityRequirement}`)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <Text style={styles.missionDesc}>
                    {t('language') === 'ja' ? item.descriptionZh : item.description}
                  </Text>

                  <View style={styles.missionProgressRow}>
                    <Text style={styles.progressLabel}>{t('tasks.progress')}</Text>
                    <Text style={styles.progressValue}>
                      {missionProgress?.currentProgress || 0} / {item.targetProgress}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill, 
                      { backgroundColor: '#F59E0B', width: `${progressPercent}%` }
                    ]} />
                  </View>

                  <View style={styles.rewardsRow}>
                    <View style={styles.rewardsGroup}>
                      <View style={styles.rewardChip}>
                        <Ionicons name="cash-outline" size={14} color="#D4A017" />
                        <Text style={styles.rewardText}>{item.rewards.coins}</Text>
                      </View>
                      <View style={styles.rewardChip}>
                        <Ionicons name="star-outline" size={14} color="#9B59B6" />
                        <Text style={styles.rewardText}>{item.rewards.experience} {t('tasks.exp')}</Text>
                      </View>
                      {item.rewards.chestType && (
                        <View style={styles.rewardChip}>
                          <Ionicons name="gift-outline" size={14} color="#22c55e" />
                          <Text style={styles.rewardText}>{item.rewards.chestType}</Text>
                        </View>
                      )}
                    </View>
                    
                    {missionProgress?.isCompleted && !missionProgress?.rewardsClaimed && (
                      <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => handleClaimMission(item.id)}
                        disabled={claimingId === item.id}
                      >
                        {claimingId === item.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.claimButtonText}>{t('tasks.claim')}</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    
                    {missionProgress?.rewardsClaimed && (
                      <View style={styles.claimedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                        <Text style={styles.claimedText}>{t('tasks.claimed')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="calendar-outline" size={40} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>{t('tasks.noTasks')}</Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>{t('achievements.progress')}</Text>
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
                    width: `${achievements.length > 0 ? (completedAchievements / achievements.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <FlatList
            data={achievements}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.achievementCard}>
                <Text style={styles.achievementName}>{t('achievements.achievement')} {item.achievementId}</Text>
                <Text style={styles.achievementProgress}>{item.progress} {t('tasks.progress')}</Text>
                <Text style={styles.achievementStatus}>{t(`achievements.status.${item.status}`)}</Text>
              </View>
            )}
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
  list: {
    padding: 16,
    paddingTop: 0,
  },
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
  achievementCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  achievementProgress: {
    fontSize: 12,
    color: '#888',
  },
  achievementStatus: {
    fontSize: 11,
    color: '#AAA',
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
  missionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
  },
  missionDesc: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  missionProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22c55e',
  },
});