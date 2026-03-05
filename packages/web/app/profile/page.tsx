'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { logout } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

  const menuItems = [
    { icon: '🏆', label: '成就', path: '/achievements' },
    { icon: '📊', label: '统计', path: '/profile/stats' },
    { icon: '⚙️', label: '设置', path: '/profile/settings' },
    { icon: '❓', label: '帮助', path: '/profile/help' },
    { icon: '📜', label: '关于', path: '/profile/about', extra: 'v1.0.0' },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800">👤 个人中心</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile header */}
        <div className="cartoon-card p-8 text-center mb-6">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800 shadow-lg">
            <span className="text-4xl md:text-5xl font-black text-white">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800">{user?.username || '探险家'}</h1>
          <p className="text-gray-500 mt-1">{user?.email}</p>
        </div>

        {/* Menu */}
        <div className="cartoon-card overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b-2 border-gray-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-bold text-gray-800 text-lg">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.extra && (
                  <span className="text-sm text-gray-400 font-medium">{item.extra}</span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-xl border-2 border-red-400 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ 退出中...' : '🚪 退出登录'}
        </button>
      </div>
    </div>
  );
}
