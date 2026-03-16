'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  getDailyTasks,
  claimTaskReward,
  refreshDailyTasks,
  getUserAchievements,
  claimAchievementReward,
} from '@/lib/api';
import { DailyTask, DailyTaskStats, AchievementProgress } from '@/types';
import TaskItem from '@/components/TaskItem';
import AchievementCard from '@/components/AchievementCard';
import {
  ClipboardList,
  Award,
  RefreshCw,
  Loader2,
  Coins,
  Star,
  CheckCircle,
} from 'lucide-react';

type TabType = 'tasks' | 'achievements';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskStats, setTaskStats] = useState<DailyTaskStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [claimingAchievementId, setClaimingAchievementId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<{ message: string; rewards: { coins: number; experience: number } } | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getDailyTasks();
      setTasks(data.tasks || []);
      setTaskStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('加载任务失败');
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      const data = await getUserAchievements();
      setAchievements(data || []);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
      setError('加载成就失败');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchTasks(), fetchAchievements()]);
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchAchievements]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleClaimTask = async (taskId: string) => {
    setClaimingTaskId(taskId);
    try {
      const response = await claimTaskReward(taskId);
      setClaimSuccess({
        message: '任务奖励领取成功!',
        rewards: response.rewards,
      });
      // Refresh tasks after claiming
      await fetchTasks();
      // Auto hide success message after 3 seconds
      setTimeout(() => setClaimSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || '领取失败');
    } finally {
      setClaimingTaskId(null);
    }
  };

  const handleClaimAchievement = async (achievementId: string) => {
    setClaimingAchievementId(achievementId);
    try {
      const response = await claimAchievementReward(achievementId);
      setClaimSuccess({
        message: '成就奖励领取成功!',
        rewards: response.rewards,
      });
      // Refresh achievements after claiming
      await fetchAchievements();
      // Auto hide success message after 3 seconds
      setTimeout(() => setClaimSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || '领取失败');
    } finally {
      setClaimingAchievementId(null);
    }
  };

  const handleRefreshTasks = async () => {
    setRefreshing(true);
    try {
      await refreshDailyTasks();
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || '刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // Auth loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return null;
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'claimed').length;
  const completedAchievements = achievements.filter((a) => a.status === 'claimed').length;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
            {activeTab === 'tasks' ? (
              <><ClipboardList className="w-6 h-6 text-amber-500" /> 每日任务</>
            ) : (
              <><Award className="w-6 h-6 text-purple-500" /> 成就</>
            )}
          </h1>

          {/* Tab Switcher */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold border-3 border-gray-800 transition-all ${
                activeTab === 'tasks'
                  ? 'bg-yellow-400 text-gray-800'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList size={18} className="inline mr-2" />
              每日任务
              {taskStats && taskStats.todayCompleted > 0 && (
                <span className="ml-2 bg-white text-yellow-600 text-xs px-2 py-0.5 rounded-full">
                  {taskStats.todayCompleted}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold border-3 border-gray-800 transition-all ${
                activeTab === 'achievements'
                  ? 'bg-purple-200 text-purple-800'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Award size={18} className="inline mr-2" />
              成就
              {completedAchievements > 0 && (
                <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {completedAchievements}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {claimSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-in-up">
          <div className="cartoon-alert cartoon-alert-success flex items-center gap-2 shadow-lg">
            <CheckCircle size={20} />
            <span className="font-bold">{claimSuccess.message}</span>
            <div className="flex items-center gap-2 ml-2">
              <span className="flex items-center gap-1 text-amber-600">
                <Coins size={14} />+{claimSuccess.rewards.coins}
              </span>
              <span className="flex items-center gap-1 text-purple-600">
                <Star size={14} />+{claimSuccess.rewards.experience}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-in-up">
          <div className="cartoon-alert cartoon-alert-error flex items-center gap-2 shadow-lg">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-2 underline">
              关闭
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 animate-page-enter">
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <>
            {/* Stats Card */}
            {taskStats && (
              <div className="cartoon-card p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">今日进度</p>
                    <p className="text-2xl font-black text-gray-800">
                      {taskStats.todayCompleted} / {taskStats.todayTotal}
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshTasks}
                    disabled={refreshing}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition border-2 border-gray-300"
                    title="刷新任务"
                  >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${taskStats.todayTotal > 0 ? (taskStats.todayCompleted / taskStats.todayTotal) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 cartoon-card">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                    <ClipboardList size={40} className="text-gray-400" />
                  </div>
                  <p className="text-xl text-gray-600 font-bold">暂无每日任务</p>
                  <p className="text-gray-500 mt-2">明天再来查看新任务</p>
                </div>
              ) : (
                tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="animate-slide-in-up"
                    style={{ animationDelay: `${Math.min(index * 60, 300)}ms`, animationFillMode: 'backwards' }}
                  >
                    <TaskItem
                      task={task}
                      onClaim={handleClaimTask}
                      isClaiming={claimingTaskId === task.id}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <>
            {/* Stats Card */}
            <div className="cartoon-card p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">成就进度</p>
                  <p className="text-2xl font-black text-gray-800">
                    {completedAchievements} / {achievements.length}
                  </p>
                </div>
                <div className="text-4xl">
                  <Award size={32} className="text-purple-500" />
                </div>
              </div>
              <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${achievements.length > 0 ? (completedAchievements / achievements.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Achievement List */}
            <div className="space-y-3">
              {achievements.length === 0 ? (
                <div className="text-center py-12 cartoon-card">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
                    <Award size={40} className="text-gray-400" />
                  </div>
                  <p className="text-xl text-gray-600 font-bold">暂无成就</p>
                  <p className="text-gray-500 mt-2">开始收集宝藏来解锁成就</p>
                </div>
              ) : (
                achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.achievement.id}
                    achievement={achievement}
                    onClaim={handleClaimAchievement}
                    isClaiming={claimingAchievementId === achievement.achievement.id}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}