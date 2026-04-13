'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocale } from '@/contexts/LocaleContext';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  searchUsers,
  removeFriend,
  getTrades,
  acceptTrade,
  rejectTrade,
} from '@/lib/api';
import FriendItem from '@/components/FriendItem';
import { Friend, FriendRequest, SearchResult, Trade } from '@/types';
import {
  Search,
  UserPlus,
  Users,
  Clock,
  Gift,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type Tab = 'friends' | 'requests' | 'trades';

export default function FriendsPage() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData, tradesData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getTrades(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
      setTrades(tradesData.filter((t: Trade) => t.status === 'pending'));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(t('friends.loadFailed'));
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setSearchResults((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, hasPendingRequest: true } : r))
      );
    } catch (err) {
      console.error('Failed to send request:', err);
      alert(t('friends.sendRequestFailed'));
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      fetchData(); // Refresh friends list
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert(t('friends.acceptRequestFailed'));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(t('friends.rejectRequestFailed'));
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    if (!confirm(t('friends.confirmRemove', { username: friend.username }))) return;

    try {
      await removeFriend(friend.id);
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
    } catch (err) {
      console.error('Failed to remove friend:', err);
      alert(t('friends.removeFailed'));
    }
  };

  const handleMessage = (friend: Friend) => {
    router.push(`/chat?userId=${friend.id}&username=${encodeURIComponent(friend.username)}`);
  };

  const handleTrade = (friend: Friend) => {
    // TODO: Navigate to trade creation page
    alert(t('friends.tradeComingSoon'));
  };

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      await acceptTrade(tradeId);
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    } catch (err) {
      console.error('Failed to accept trade:', err);
      alert(t('friends.acceptTradeFailed'));
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    try {
      await rejectTrade(tradeId);
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    } catch (err) {
      console.error('Failed to reject trade:', err);
      alert(t('friends.rejectTradeFailed'));
    }
  };

  const toggleTradeExpand = (tradeId: string) => {
    setExpandedTrades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const onlineFriends = friends.filter((f) => f.isOnline);
  const offlineFriends = friends.filter((f) => !f.isOnline);

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
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            {t('friends.title')}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-[60px] z-30">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 font-bold text-center transition-colors relative ${
              activeTab === 'friends' ? 'text-yellow-600' : 'text-gray-500'
            }`}
          >
            <Users size={18} className="inline mr-1" />
            {t('friends.friendsTab')}
            {friends.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {friends.length}
              </span>
            )}
            {activeTab === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 font-bold text-center transition-colors relative ${
              activeTab === 'requests' ? 'text-yellow-600' : 'text-gray-500'
            }`}
          >
            <Clock size={18} className="inline mr-1" />
            {t('friends.requestsTab')}
            {requests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                {requests.length}
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex-1 py-3 font-bold text-center transition-colors relative ${
              activeTab === 'trades' ? 'text-yellow-600' : 'text-gray-500'
            }`}
          >
            <Gift size={18} className="inline mr-1" />
            {t('friends.tradesTab')}
            {trades.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs">
                {trades.length}
              </span>
            )}
            {activeTab === 'trades' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 animate-page-enter">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-3 border-red-400 text-red-700 px-4 py-3 rounded-xl font-bold flex items-center justify-between mb-4">
            <span>{error}</span>
            <button onClick={fetchData} className="ml-2 underline hover:text-red-900">
              {t('friends.retry')}
            </button>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {/* Search */}
            <div className="mb-4">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-full cartoon-btn flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                {t('friends.addFriendButton')}
              </button>

              {showSearch && (
                <div className="mt-3 cartoon-card p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('friends.searchPlaceholderEmail')}
                      className="cartoon-input flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className="cartoon-btn cartoon-btn-icon"
                    >
                      {searching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center border-2 border-gray-800">
                              <span className="text-sm font-bold text-white">
                                {result.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{result.username}</p>
                              <p className="text-xs text-gray-500">{result.email}</p>
                            </div>
                          </div>
                          {result.isFriend ? (
                            <span className="text-sm text-green-600 font-medium">{t('friends.alreadyFriends')}</span>
                          ) : result.hasPendingRequest ? (
                            <span className="text-sm text-gray-500">{t('friends.requestSent')}</span>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(result.id)}
                              className="cartoon-btn cartoon-btn-sm"
                            >
                              {t('friends.add')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Online friends */}
            {onlineFriends.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {t('friends.onlineCount', { count: onlineFriends.length })}
                </h2>
                <div className="space-y-2">
                  {onlineFriends.map((friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                      onMessage={handleMessage}
                      onTrade={handleTrade}
                      onRemove={handleRemoveFriend}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Offline friends */}
            {offlineFriends.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  {t('friends.offlineCount', { count: offlineFriends.length })}
                </h2>
                <div className="space-y-2">
                  {offlineFriends.map((friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                      onMessage={handleMessage}
                      onTrade={handleTrade}
                      onRemove={handleRemoveFriend}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {friends.length === 0 && (
              <div className="text-center py-12 cartoon-card">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
                  <Users size={40} className="text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-bold">{t('friends.noFriendsYet')}</p>
                <p className="text-gray-500 mt-2">{t('friends.searchForFriends')}</p>
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-12 cartoon-card">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
                  <Clock size={40} className="text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-bold">{t('friends.noFriendRequests')}</p>
                <p className="text-gray-500 mt-2">{t('friends.newRequestsAppearHere')}</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="cartoon-card p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center border-2 border-gray-800 flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {request.requester.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{request.requester.username}</p>
                      <p className="text-sm text-gray-500 truncate">{request.requester.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="text-center py-12 cartoon-card">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
                  <Gift size={40} className="text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-bold">{t('friends.noTradeRequests')}</p>
                <p className="text-gray-500 mt-2">{t('friends.tradeRequestsAppearHere')}</p>
              </div>
            ) : (
              trades.map((trade) => (
                <div key={trade.id} className="cartoon-card p-4">
                  <button
                    onClick={() => toggleTradeExpand(trade.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center border-2 border-gray-800">
                        <span className="text-sm font-bold text-white">
                          {trade.initiator.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800">{trade.initiator.username}</p>
                        <p className="text-sm text-gray-500">
                          提供 {trade.initiatorItems.length} 件物品
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedTrades.has(trade.id) ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedTrades.has(trade.id) && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-2">{t('friends.theyOffer')}</p>
                          <div className="space-y-1">
                            {trade.initiatorItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-sm bg-gray-100 rounded px-2 py-1"
                              >
                                {item.itemName} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-2">{t('friends.theyWant')}</p>
                          <div className="space-y-1">
                            {trade.receiverItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-sm bg-gray-100 rounded px-2 py-1"
                              >
                                {item.itemName} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptTrade(trade.id)}
                          className="flex-1 cartoon-btn cartoon-btn-secondary"
                        >
                          <Check size={18} className="inline mr-1" />
                          {t('friends.accept')}
                        </button>
                        <button
                          onClick={() => handleRejectTrade(trade.id)}
                          className="flex-1 cartoon-btn cartoon-btn-accent"
                        >
                          <X size={18} className="inline mr-1" />
                          {t('friends.reject')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}