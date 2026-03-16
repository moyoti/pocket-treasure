'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Trophy, Medal, Gem, Target, Package } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  collectionCount: number;
}

const RANK_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500', text: 'text-yellow-700', border: 'border-yellow-400', label: '金' },
  2: { bg: 'bg-gradient-to-br from-gray-200 to-gray-400', text: 'text-gray-600', border: 'border-gray-400', label: '银' },
  3: { bg: 'bg-gradient-to-br from-orange-300 to-orange-500', text: 'text-orange-700', border: 'border-orange-400', label: '铜' },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (style) {
    return (
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} border-2 ${style.border} shadow-md`}>
        <Medal className={`w-5 h-5 ${style.text}`} strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 border-2 border-gray-300">
      <span className="text-sm font-black text-gray-500">#{rank}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [leaderboardData, rankData] = await Promise.all([
          api.get('/leaderboard'),
          api.get('/leaderboard/me'),
        ]);
        setLeaderboard(leaderboardData.data);
        setMyRank(rankData.data.rank);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-500" strokeWidth={2.5} />
              {t('leaderboard.title')}
            </h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="cartoon-card p-6 mb-6">
            <div className="flex items-end justify-center gap-4">
              {[64, 88, 48].map((h, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 skeleton rounded-full mb-2" />
                  <div className="h-4 skeleton w-16 mb-2" />
                  <div className="w-full skeleton rounded-t-lg" style={{ height: `${h}px` }} />
                </div>
              ))}
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="cartoon-card px-4 py-3 flex items-center gap-3 mb-2">
              <div className="w-11 h-11 skeleton rounded-full" />
              <div className="flex-1">
                <div className="h-5 skeleton w-1/3 mb-1" />
                <div className="h-3 skeleton w-1/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" strokeWidth={2.5} />
            {t('leaderboard.title')}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-page-enter">
        {/* My rank card */}
        {myRank && (
          <div className="cartoon-card p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                <span className="text-sm font-black text-white">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{t('leaderboard.myRank')}</p>
                <p className="font-black text-gray-800">{user?.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-amber-600">#{myRank}</p>
            </div>
          </div>
        )}

        {/* Podium - Top 3 */}
        {top3.length > 0 && (
          <div className="cartoon-card p-6 mb-6">
            <div className="flex items-end justify-center gap-4">
              {/* 2nd place */}
              {top3[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center border-3 border-gray-800 mb-2 shadow-md">
                    <span className="text-lg font-black text-gray-700">{top3[1].username.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 truncate max-w-[80px] text-center">{top3[1].username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Package className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500 font-bold">{top3[1].collectionCount}</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-2 flex items-center justify-center py-3 border-2 border-gray-400" style={{ height: '64px' }}>
                    <Medal className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              )}
              {/* 1st place */}
              {top3[0] && (
                <div className="flex flex-col items-center flex-1">
                  <Trophy className="w-6 h-6 text-yellow-500 mb-1" />
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center border-3 border-gray-800 mb-2 shadow-lg">
                    <span className="text-xl font-black text-yellow-900">{top3[0].username.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate max-w-[80px] text-center">{top3[0].username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Package className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-amber-600 font-bold">{top3[0].collectionCount}</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg mt-2 flex items-center justify-center py-3 border-2 border-yellow-600" style={{ height: '88px' }}>
                    <span className="text-2xl font-black text-yellow-900">#1</span>
                  </div>
                </div>
              )}
              {/* 3rd place */}
              {top3[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center border-3 border-gray-800 mb-2 shadow-md">
                    <span className="text-lg font-black text-orange-900">{top3[2].username.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 truncate max-w-[80px] text-center">{top3[2].username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Package className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-500 font-bold">{top3[2].collectionCount}</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg mt-2 flex items-center justify-center py-3 border-2 border-orange-600" style={{ height: '48px' }}>
                    <Medal className="w-5 h-5 text-orange-900" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rank 4+ list */}
        {rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((entry, index) => (
              <div
                key={entry.userId}
                className={`cartoon-card px-4 py-3 flex items-center gap-3 animate-slide-in-up ${
                  user?.id === entry.userId ? 'border-4 border-yellow-400 bg-yellow-50' : ''
                }`}
                style={{ animationDelay: `${Math.min(index * 50, 400)}ms`, animationFillMode: 'backwards' }}
              >
                <RankBadge rank={entry.rank} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{entry.username}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Package className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{entry.collectionCount} {t('profile.stats.collections')}</span>
                  </div>
                </div>
                <p className="text-lg font-black text-yellow-600 flex-shrink-0">{entry.collectionCount}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {leaderboard.length === 0 && (
          <div className="text-center py-12 cartoon-card">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-300">
              <Target size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-bold">{t('leaderboard.noData')}</p>
            <button
              onClick={() => router.push('/map')}
              className="cartoon-btn mt-4"
            >
              {t('leaderboard.goCollect')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
