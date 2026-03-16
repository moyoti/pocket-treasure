'use client';

import { AchievementProgress, AchievementStatus } from '@/types';
import { Check, Gift, Coins, Star, Award, Loader2 } from 'lucide-react';

interface AchievementCardProps {
  achievement: AchievementProgress;
  onClaim: (achievementId: string) => Promise<void>;
  isClaiming?: boolean;
}

const ACHIEVEMENT_TYPE_NAMES: Record<string, string> = {
  collection: '收集成就',
  rarity: '稀有成就',
  distance: '探索成就',
  streak: '连续登录',
  special: '特殊成就',
};

const TIER_COLORS: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-blue-400 to-blue-500',
  3: 'from-purple-400 to-purple-500',
  4: 'from-yellow-400 to-yellow-500',
};

const TIER_BORDER_COLORS: Record<number, string> = {
  1: 'border-gray-400',
  2: 'border-blue-400',
  3: 'border-purple-400',
  4: 'border-yellow-400',
};

export default function AchievementCard({
  achievement,
  onClaim,
  isClaiming = false,
}: AchievementCardProps) {
  const { achievement: ach, progress, requirement, status, canClaim } = achievement;
  const progressPercent = Math.min((progress / requirement) * 100, 100);
  const isCompleted = status === 'completed' || progress >= requirement;
  const isClaimed = status === 'claimed';

  const getStatusBadge = () => {
    if (isClaimed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
          <Check size={10} />
        </span>
      );
    }
    if (canClaim || isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300 animate-pulse">
          <Gift size={10} />
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden transition-all duration-300 border-2 ${
        TIER_BORDER_COLORS[ach.tier] || 'border-gray-300'
      } ${isClaimed ? 'opacity-70' : ''} ${
        canClaim ? 'ring-2 ring-yellow-400 ring-offset-2 animate-pulse' : ''
      }`}
    >
      {/* Achievement Header with Icon */}
      <div
        className={`p-4 bg-gradient-to-r ${TIER_COLORS[ach.tier] || 'from-gray-400 to-gray-500'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/25 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-sm">
              {ach.icon ? (
                <span className="text-2xl leading-none select-none">{ach.icon}</span>
              ) : (
                <Award size={24} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{ach.name}</h3>
              <p className="text-white/80 text-xs">{ACHIEVEMENT_TYPE_NAMES[ach.type]}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Description */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-gray-600 text-sm">{ach.description}</p>
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">进度</span>
          <span className="text-xs font-bold text-gray-700">
            {progress} / {requirement}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : `bg-gradient-to-r ${TIER_COLORS[ach.tier] || 'from-gray-400 to-gray-500'}`
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      {ach.rewards && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-600">
                <Coins size={14} />
                <span className="font-bold text-sm">{ach.rewards.coins}</span>
              </div>
              <div className="flex items-center gap-1 text-purple-600">
                <Star size={14} />
                <span className="font-bold text-sm">{ach.rewards.experience}</span>
              </div>
              {ach.rewards.title && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {ach.rewards.title}
                </span>
              )}
            </div>

            {(canClaim || isCompleted) && !isClaimed && (
              <button
                onClick={() => onClaim(ach.id)}
                disabled={isClaiming}
                className="cartoon-btn cartoon-btn-sm text-xs py-1 px-3"
              >
                {isClaiming ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Gift size={12} className="mr-1" /> 领取
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}