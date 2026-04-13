'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { getConversations, getMessages, sendMessage, markMessagesAsRead, getFriends } from '@/lib/api';
import ChatMessage from '@/components/ChatMessage';
import { Conversation, Message, Friend } from '@/types';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  Search,
  Users,
} from 'lucide-react';

function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat view state
  const [activeChat, setActiveChat] = useState<{
    userId: string;
    username: string;
    avatar?: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if we should open a specific chat from URL params
  const userIdParam = searchParams.get('userId');
  const usernameParam = searchParams.get('username');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [conversationsData, friendsData] = await Promise.all([
        getConversations(),
        getFriends(),
      ]);
      setConversations(conversationsData);
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(t('chat.loadFailed'));
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
      fetchData();
    }
  }, [user, fetchData]);

  // Open chat from URL params (only once when params are available and data is loaded)
  useEffect(() => {
    if (userIdParam && usernameParam && !loading && !activeChat) {
      handleOpenChat(userIdParam, usernameParam, undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdParam, usernameParam, loading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpenChat = async (userId: string, username: string, avatar?: string) => {
    setActiveChat({ userId, username, avatar });
    setLoadingMessages(true);
    setMessages([]);

    try {
      const messagesData = await getMessages(userId);
      setMessages(messagesData);
      await markMessagesAsRead(userId);
      // Update unread count in conversations
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === userId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleBackToList = () => {
    setActiveChat(null);
    setMessages([]);
    setNewMessage('');
    // Remove URL params
    router.replace('/chat');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await sendMessage(activeChat.userId, content);
      setMessages((prev) => [...prev, sentMessage]);

      // Update conversations list
      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === activeChat.userId);
        if (existing) {
          return [
            { ...existing, lastMessage: sentMessage },
            ...prev.filter((c) => c.userId !== activeChat.userId),
          ];
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(t('chat.sendFailed'));
      setNewMessage(content); // Restore message on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatLastMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.yesterday');
    }

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
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

  // Chat View
  if (activeChat) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        {/* Header */}
        <div className="bg-white border-b-4 border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={handleBackToList}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-800" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center border-2 border-gray-800">
            {activeChat.avatar ? (
              <img
                src={activeChat.avatar}
                alt={activeChat.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {activeChat.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-800 flex-1 truncate">
            {activeChat.username}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 border-2 border-gray-200">
                <MessageCircle size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-bold">{t('chat.noMessages')}</p>
              <p className="text-gray-500 text-sm mt-1">{t('chat.sendMessageToStart')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user.id}
                  senderName={activeChat.username}
                  senderAvatar={activeChat.avatar}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t-2 border-gray-200 px-4 py-3 sticky bottom-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              className="cartoon-input flex-1"
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="cartoon-btn cartoon-btn-icon disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><MessageCircle className="w-6 h-6 text-teal-500" />{t('chat.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto animate-page-enter">
        {/* Error message */}
        {error && (
          <div className="px-4 py-4">
            <div className="bg-red-100 border-3 border-red-400 text-red-700 px-4 py-3 rounded-xl font-bold text-center">
              {error}
              <button onClick={fetchData} className="ml-2 underline hover:text-red-900">
                {t('common.retry')}
              </button>
            </div>
          </div>
        )}

        {/* Friends with chat option */}
        {friends.length > 0 && (
          <div className="px-4 py-3 border-b-2 border-gray-200 bg-white">
            <p className="text-xs font-bold text-gray-500 mb-2">{t('chat.startChat')}</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {friends.slice(0, 10).map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleOpenChat(friend.id, friend.username, friend.avatar)}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center border-2 border-gray-800">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {friend.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium max-w-[60px] truncate">
                    {friend.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations list */}
        <div className="px-4 py-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12 cartoon-card">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
                <MessageCircle size={40} className="text-gray-400" />
              </div>
              <p className="text-xl text-gray-600 font-bold">{t('chat.noConversations')}</p>
              <p className="text-gray-500 mt-2">{t('chat.clickAboveToStartChat')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 mb-2">{t('chat.recentChats')}</p>
              {conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => handleOpenChat(conv.userId, conv.username, conv.avatar)}
                  className="cartoon-card w-full p-4 text-left hover:translate-y-[-2px] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center border-2 border-gray-800">
                        {conv.avatar ? (
                          <img
                            src={conv.avatar}
                            alt={conv.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {conv.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-gray-800 truncate">{conv.username}</p>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatLastMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
        <div className="cartoon-loader"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}