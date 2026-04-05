'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getMessages, sendMessage, markMessagesAsRead } from '@/lib/api';
import { Message } from '@/types';
import { Send, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = user?.id || '';
  const userId = params?.userId;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !user) return;

      try {
        setLoading(true);
        const messagesData = await getMessages(userId);
        setMessages(messagesData);
        await markMessagesAsRead(userId);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await sendMessage(userId, content);
      setMessages((prev) => [...prev, sentMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('发送失败');
      setNewMessage(content);
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleBack = () => {
    router.push('/chat');
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      <div className="bg-white border-b-4 border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 truncate">
          {userId}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 border-2 border-gray-200">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-bold">还没有消息，开始聊天吧！</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-3 ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl ${
                    message.senderId === currentUserId
                      ? 'bg-[#D4A017] text-white rounded-br-sm'
                      : 'bg-white border border-[#F0E8D8] rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm md:text-base break-words">{message.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.senderId === currentUserId ? 'text-white/70 text-right' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t-2 border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 rounded-full border-2 border-gray-200 px-4 py-2.5 focus:outline-none focus:border-[#D4A017] transition-colors"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-full bg-[#D4A017] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C4940F] transition-colors"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <Send size={20} className="text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
