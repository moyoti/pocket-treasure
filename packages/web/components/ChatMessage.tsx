'use client';

import React from 'react';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export default function ChatMessage({
  message,
  isOwn,
  showAvatar = true,
  senderName,
  senderAvatar,
}: ChatMessageProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isOwn) {
    return (
      <div className="flex justify-end mb-3">
        <div className="flex items-end gap-2 max-w-[75%]">
          <div className="flex flex-col items-end">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 px-4 py-2 rounded-2xl rounded-br-md border-2 border-gray-800 shadow-sm">
              <p className="text-sm md:text-base break-words">{message.content}</p>
            </div>
            <span className="text-xs text-gray-400 mt-1 mr-1">
              {formatTime(message.createdAt)}
              {!message.isRead && <span className="ml-1 text-blue-500">已发送</span>}
              {message.isRead && <span className="ml-1 text-green-500">已读</span>}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-end gap-2 max-w-[75%]">
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center border-2 border-gray-800 flex-shrink-0">
            {senderAvatar ? (
              <img
                src={senderAvatar}
                alt={senderName || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {(senderName || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-col items-start">
          {showAvatar && senderName && (
            <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
          )}
          <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md border-2 border-gray-800 shadow-sm">
            <p className="text-sm md:text-base break-words">{message.content}</p>
          </div>
          <span className="text-xs text-gray-400 mt-1 ml-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}