'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getUserAchievements, claimAchievementReward } from '@/lib/api';
import { AchievementProgress } from '@/types';
import AchievementCard from '@/components/AchievementCard';
import { Award, Loader2, CheckCircle, Coins, Star } from 'lucide-react';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<{ message: string; rewards: { coins: number; experience: number } } | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchAchievements = useCallback(async () => {
    try {
      const data = await getUserAchievements();
      setAchievements(data || []);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
      setError('加载成就失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user, fetchAchievements]);

  const handleClaim = async (achievementId: string) => {
    setClaimingId(achievementId);
    try {
      const response = await claimAchievementReward(achievementId);
      setClaimSuccess({
        message: '成就奖励领取成功!',
        rewards: response.rewards,
      });
      await fetchAchievements();
      setTimeout(() => setClaimSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || '领取失败');
    } finally {
      setClaimingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
              <Award className="w-7 h-7 text-purple-500" />
              成就
            </h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="cartoon-card p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 skeleton w-20 mb-2" />
                <div className="h-7 skeleton w-16" />
              </div>
              <div className="w-16 h-16 skeleton rounded-full" />
            </div>
            <div className="mt-3 h-3 skeleton w-full rounded-full" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-3">
              <div className="p-4 skeleton h-16" />
              <div className="p-4">
                <div className="h-4 skeleton w-3/4 mb-3" />
                <div className="h-2 skeleton w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = achievements.filter((a) => a.status === 'claimed').length;
  const canClaimCount = achievements.filter((a) => a.canClaim).length;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
            <Award className="w-7 h-7 text-purple-500" />
            成就
          </h1>
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
        {/* Stats Card */}
        <div className="cartoon-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">已完成成就</p>
              <p className="text-2xl font-black text-gray-800">
                {completedCount} / {achievements.length}
              </p>
              {canClaimCount > 0 && (
                <p className="text-sm text-yellow-600 font-bold mt-1">
                  {canClaimCount} 个奖励待领取
                </p>
              )}
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Award size={32} className="text-white" />
            </div>
          </div>
          <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
              style={{
                width: `${achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0}%`,
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
            achievements.map((achievement, index) => (
              <div
                key={achievement.achievement.id}
                className="animate-slide-in-up"
                style={{ animationDelay: `${Math.min(index * 60, 400)}ms`, animationFillMode: 'backwards' }}
              >
                <AchievementCard
                  achievement={achievement}
                  onClaim={handleClaim}
                  isClaiming={claimingId === achievement.achievement.id}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}