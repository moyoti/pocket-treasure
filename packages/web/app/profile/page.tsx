'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { logout, getCoinBalance } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Coins,
  Store,
  Dices,
  TrendingUp,
  Users,
  MessageCircle,
  Trophy,
  BarChart2,
  Settings,
  HelpCircle,
  Info,
  LucideIcon,
} from 'lucide-react';
import { CoinBalance } from '@/types';

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<CoinBalance | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getCoinBalance().then(setBalance).catch(console.error);
    }
  }, [user]);

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return;

    setLoading(true);
    try {
      await logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
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

  const menuItems: { icon: LucideIcon; label: string; path: string; extra?: string; color: string; bg: string }[] = [
    { icon: Store, label: '商店', path: '/shop', color: 'text-orange-600', bg: 'bg-orange-100' },
    { icon: Dices, label: '抽奖', path: '/gacha', color: 'text-purple-600', bg: 'bg-purple-100' },
    { icon: TrendingUp, label: '市场', path: '/market', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: Users, label: '好友', path: '/friends', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: MessageCircle, label: '聊天', path: '/chat', color: 'text-teal-600', bg: 'bg-teal-100' },
    { icon: Trophy, label: '成就', path: '/achievements', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { icon: BarChart2, label: '统计', path: '/profile/stats', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { icon: Settings, label: '设置', path: '/profile/settings', color: 'text-gray-600', bg: 'bg-gray-100' },
    { icon: HelpCircle, label: '帮助', path: '/profile/help', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { icon: Info, label: '关于', path: '/profile/about', extra: 'v1.0.0', color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800">个人中心</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-page-enter">
        {/* Profile header */}
        <div className="cartoon-card p-8 text-center mb-6">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800 shadow-lg">
            <span className="text-4xl md:text-5xl font-black text-white">
              {user?.username?.charAt(0).toUpperCase() || '探'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800">{user?.username || '探险家'}</h1>
          <p className="text-gray-500 mt-1">{user?.email}</p>

          {/* Coin balance */}
          {balance && (
            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-3 border-yellow-400 rounded-full px-6 py-2">
              <Coins className="w-6 h-6 text-yellow-600" />
              <span className="font-black text-yellow-700 text-xl">{balance.balance.toLocaleString()}</span>
              <span className="text-yellow-600 font-medium">金币</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="cartoon-card overflow-hidden">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-amber-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b-2 border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg}`}>
                    <IconComponent className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.extra && (
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{item.extra}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-xl border-3 border-red-400 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '退出中...' : '退出登录'}
        </button>
      </div>
    </div>
  );
}
