'use client';

import React from 'react';
import { User, MessageCircle, Gift, MoreVertical, Clock } from 'lucide-react';
import { Friend } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface FriendItemProps {
  friend: Friend;
  onMessage?: (friend: Friend) => void;
  onTrade?: (friend: Friend) => void;
  onRemove?: (friend: Friend) => void;
}

export default function FriendItem({ friend, onMessage, onTrade, onRemove }: FriendItemProps) {
  const { t } = useLocale();
  const [showMenu, setShowMenu] = React.useState(false);

  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('friends.justNow');
    if (diffMins < 60) return t('friends.minutesAgo', { minutes: diffMins });
    if (diffHours < 24) return t('friends.hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('friends.daysAgo', { days: diffDays });
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="cartoon-card p-4 hover:translate-y-[-2px] transition-all">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center border-3 border-gray-800 shadow-md">
            {friend.avatar ? (
              <img
                src={friend.avatar}
                alt={friend.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white">
                {friend.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Online indicator */}
          <div
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
              friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{friend.username}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            {friend.isOnline ? (
              <span className="text-green-500 font-medium">{t('friends.online')}</span>
            ) : (
              <>
                <Clock size={12} />
                <span>{formatLastSeen(friend.lastSeenAt)}</span>
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMessage?.(friend)}
            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            title={t('friends.sendMessage')}
          >
            <MessageCircle size={20} />
          </button>
          <button
            onClick={() => onTrade?.(friend)}
            className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
            title={t('friends.initiateTrade')}
          >
            <Gift size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border-2 border-gray-200 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRemove?.(friend);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 text-sm font-medium"
                  >
                    {t('friends.removeFriend')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}