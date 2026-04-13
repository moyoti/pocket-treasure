'use client';

import { DailyTask, TaskStatus } from '@/types';
import { Check, Gift, Coins, Star, Loader2, LogIn, Gem, MapPin, Sparkles, LucideIcon } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface TaskItemProps {
  task: DailyTask;
  onClaim: (taskId: string) => Promise<void>;
  isClaiming?: boolean;
}

const TASK_TYPE_KEYS: Record<string, string> = {
  login: 'tasks.dailyLogin',
  collect: 'tasks.collectTreasures',
  visit_poi: 'tasks.visitPoi',
  collect_rarity: 'tasks.collectRarity',
};

const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  login: LogIn,
  collect: Gem,
  visit_poi: MapPin,
  collect_rarity: Sparkles,
};

export default function TaskItem({ task, onClaim, isClaiming = false }: TaskItemProps) {
  const { t } = useLocale();
  const progressPercent = Math.min((task.currentProgress / task.targetProgress) * 100, 100);
  const isCompleted = task.status === 'completed';
  const isClaimed = task.status === 'claimed';
  const isInProgress = task.status === 'in_progress';
  const taskTypeKey = TASK_TYPE_KEYS[task.taskType];
  const taskTypeName = taskTypeKey ? t(taskTypeKey) : task.taskType;

  const getStatusBadge = () => {
    if (isClaimed) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border-2 border-green-300">
          <Check size={12} /> {t('tasks.claimed')}
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border-2 border-yellow-300 animate-pulse">
          <Gift size={12} /> {t('tasks.claimable')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border-2 border-blue-300">
        {t('tasks.inProgress')}
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl border-3 border-gray-800 overflow-hidden transition-all duration-300 ${
        isClaimed ? 'opacity-60' : ''
      } ${isCompleted && !isClaimed ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
      style={{ borderWidth: '3px' }}
    >
      {/* Task Header */}
      <div className="p-4 border-b-2 border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-yellow-100' : 'bg-blue-50'
              }`}
            >
              {(() => {
                const IconComponent = TASK_TYPE_ICONS[task.taskType];
                return IconComponent ? (
                  <IconComponent size={20} className={isCompleted ? 'text-yellow-600' : 'text-blue-500'} />
                ) : (
                  <Star size={20} className={isCompleted ? 'text-yellow-600' : 'text-blue-500'} />
                );
              })()}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {taskTypeName}
              </h3>
              {task.rarityRequirement && (
                <span className="text-xs text-purple-600 font-medium">
                  {t('tasks.rarityRequired')}: {task.rarityRequirement}{t('inventory.rarity.quality')}
                </span>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 font-medium">{t('tasks.progress')}</span>
          <span className="text-sm font-bold text-gray-800">
            {task.currentProgress} / {task.targetProgress}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="px-4 py-3 bg-gray-50 border-t-2 border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-amber-600">
              <Coins size={16} />
              <span className="font-bold text-sm">{task.rewards.coins}</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600">
              <Star size={16} />
              <span className="font-bold text-sm">{task.rewards.experience} EXP</span>
            </div>
          </div>

          {isCompleted && !isClaimed && (
            <button
              onClick={() => onClaim(task.id)}
              disabled={isClaiming}
              className="cartoon-btn cartoon-btn-sm text-sm"
            >
              {isClaiming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Gift size={16} className="mr-1" /> {t('tasks.claim')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}