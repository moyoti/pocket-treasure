'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BarChart2, TrendingUp, Gem, Trophy, Calendar } from 'lucide-react';

interface CollectionStats {
  totalItems: number;
  uniqueItems: number;
  byRarity: Record<string, number>;
}

interface AchievementProgress {
  completed: number;
  total: number;
}

interface UserStats {
  collection: CollectionStats;
  achievements: AchievementProgress;
  joinDate: string;
}

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
  legendary: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300' },
};

const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchStats();
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    try {
      const [inventoryRes, achievementsRes] = await Promise.all([
        api.get('/inventory/stats'),
        api.get('/achievements/me'),
      ]);

      const completedAchievements = achievementsRes.data.filter((a: any) => a.completed).length;

      setStats({
        collection: inventoryRes.data,
        achievements: {
          completed: completedAchievements,
          total: achievementsRes.data.length,
        },
        joinDate: user?.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const daysSinceJoin = Math.floor(
    (new Date().getTime() - new Date(stats?.joinDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalByRarity = stats?.collection.byRarity || {};
  const totalItems = stats?.collection.totalItems || 0;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/profile" className="text-gray-600 hover:text-gray-800 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><BarChart2 className="w-6 h-6 text-indigo-500" />统计</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-page-enter">
        {/* 总览卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cartoon-card p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />收集总览</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <p className="text-4xl font-black text-amber-600">{stats?.collection.totalItems || 0}</p>
              <p className="text-sm text-gray-600 mt-1">总收集数</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <p className="text-4xl font-black text-green-500">{stats?.collection.uniqueItems || 0}</p>
              <p className="text-sm text-gray-600 mt-1">物品种类</p>
            </div>
          </div>
        </motion.div>

        {/* 稀有度分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="cartoon-card p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Gem className="w-5 h-5 text-purple-500" />稀有度分布</h2>
          <div className="space-y-3">
            {Object.entries(totalByRarity).map(([rarity, count], index) => {
              const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common;
              const percentage = totalItems > 0 ? Math.round(((count as number) / totalItems) * 100) : 0;
              return (
                <div key={rarity} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium text-gray-600">{RARITY_NAMES[rarity]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 border-2 border-gray-300 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      className={`h-full ${colors.bg} ${colors.border} border-r-2`}
                    />
                  </div>
                  <span className={`text-sm font-bold ${colors.text} w-12 text-right`}>{count as number}</span>
                </div>
              );
            })}
            {Object.keys(totalByRarity).length === 0 && (
              <p className="text-gray-400 text-center py-4">还没有收集到任何物品，快去探索吧！</p>
            )}
          </div>
        </motion.div>

        {/* 成就进度 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="cartoon-card p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />成就进度</h2>
          <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">已完成成就</span>
              <span className="font-bold text-gray-800">
                {stats?.achievements.completed} / {stats?.achievements.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-gray-300 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((stats?.achievements.completed || 0) / (stats?.achievements.total || 1)) * 100}%` }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {stats?.achievements.total === 0
                ? '暂无成就数据'
                : `已完成 ${Math.round(((stats?.achievements.completed || 0) / (stats?.achievements.total || 1)) * 100)}% 的成就`}
            </p>
          </div>
        </motion.div>

        {/* 探险天数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="cartoon-card p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" />探险历程</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-4xl font-black text-blue-500">{daysSinceJoin}</p>
              <p className="text-sm text-gray-600 mt-1">加入天数</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-4xl font-black text-purple-500">
                {daysSinceJoin > 0 ? Math.round((stats?.collection.totalItems || 0) / daysSinceJoin * 10) / 10 : 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">日均收集</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
