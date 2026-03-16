import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
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
} from '@/api/social';
import { Friend, FriendRequest, SearchResult, Trade } from '@/types';

type Tab = 'friends' | 'requests' | 'trades';

export default function FriendsScreen() {
  const { user } = useAuth();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
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
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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
      Alert.alert('Error', 'Search failed');
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
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      fetchData();
    } catch (err) {
      console.error('Failed to accept request:', err);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friend.id);
              setFriends((prev) => prev.filter((f) => f.id !== friend.id));
            } catch (err) {
              console.error('Failed to remove friend:', err);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleMessage = (friend: Friend) => {
    router.push(`/chat/${friend.id}?username=${encodeURIComponent(friend.username)}`);
  };

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      await acceptTrade(tradeId);
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
      Alert.alert('Success', 'Trade accepted!');
    } catch (err) {
      console.error('Failed to accept trade:', err);
      Alert.alert('Error', 'Failed to accept trade');
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    try {
      await rejectTrade(tradeId);
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    } catch (err) {
      console.error('Failed to reject trade:', err);
      Alert.alert('Error', 'Failed to reject trade');
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

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
          <View style={[styles.onlineIndicator, item.isOnline ? styles.online : styles.offline]} />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.username}</Text>
          <Text style={styles.friendStatus}>{item.isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity style={styles.chatActionButton} onPress={() => handleMessage(item)}>
          <Ionicons name="chatbubble-outline" size={16} color="#D4A017" />
          <Text style={styles.chatActionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeActionButton}
          onPress={() => handleRemoveFriend(item)}
        >
          <Ionicons name="person-remove-outline" size={14} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.requester.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.requester.username}</Text>
          <Text style={styles.friendStatus}>Wants to be friends</Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={18} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Ionicons name="close" size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTrade = ({ item }: { item: Trade }) => {
    const isExpanded = expandedTrades.has(item.id);
    return (
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => toggleTradeExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.friendRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.initiator.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.initiator.username}</Text>
            <Text style={styles.friendStatus}>
              Offers {item.initiatorItems.length} item(s)
            </Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#CCC" />
        </View>
        {isExpanded && (
          <View style={styles.tradeDetails}>
            <View style={styles.tradeColumns}>
              <View style={styles.tradeColumn}>
                <Text style={styles.tradeLabel}>They offer:</Text>
                {item.initiatorItems.map((i, idx) => (
                  <Text key={idx} style={styles.tradeItemText}>
                    {i.itemName} x{i.quantity}
                  </Text>
                ))}
              </View>
              <View style={styles.tradeArrow}>
                <Ionicons name="swap-horizontal" size={20} color="#CCC" />
              </View>
              <View style={styles.tradeColumn}>
                <Text style={styles.tradeLabel}>They want:</Text>
                {item.receiverItems.map((i, idx) => (
                  <Text key={idx} style={styles.tradeItemText}>
                    {i.itemName} x{i.quantity}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.tradeActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptTrade(item.id)}
              >
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectTrade(item.id)}
              >
                <Ionicons name="close" size={16} color="#dc2626" />
                <Text style={styles.rejectText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <View style={styles.searchResultItem}>
      <View style={styles.friendRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.username}</Text>
          <Text style={styles.friendStatus}>{item.email}</Text>
        </View>
      </View>
      {item.isFriend ? (
        <View style={styles.statusPill}>
          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
          <Text style={styles.alreadyFriend}>Friends</Text>
        </View>
      ) : item.hasPendingRequest ? (
        <View style={styles.statusPill}>
          <Ionicons name="time-outline" size={14} color="#999" />
          <Text style={styles.pendingRequest}>Sent</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleSendRequest(item.id)}
        >
          <Ionicons name="person-add" size={16} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'friends' as Tab, label: 'Friends', count: friends.length, icon: 'people-outline' },
          { key: 'requests' as Tab, label: 'Requests', count: requests.length, icon: 'person-add-outline' },
          { key: 'trades' as Tab, label: 'Trades', count: trades.length, icon: 'swap-horizontal-outline' },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#1A1A1A' : '#AAA'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.badge,
                tab.key === 'requests' && styles.redBadge,
                tab.key === 'trades' && styles.orangeBadge,
              ]}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <>
          <TouchableOpacity
            style={styles.searchToggle}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="person-add-outline" size={18} color="#D4A017" />
            <Text style={styles.searchToggleText}>Add Friend</Text>
          </TouchableOpacity>

          {showSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputRow}>
                <Ionicons name="search" size={18} color="#AAA" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search username or email..."
                  placeholderTextColor="#AAA"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searching && <ActivityIndicator size="small" color="#D4A017" />}
              </View>
            </View>
          )}

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.searchResults}
            />
          )}

          <FlatList
            data={[...onlineFriends, ...offlineFriends]}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              onlineFriends.length > 0 ? (
                <Text style={styles.sectionHeader}>
                  Online ({onlineFriends.length})
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="people-outline" size={40} color="#CCC" />
                </View>
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>Search and add friends to play together!</Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="mail-outline" size={40} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>New friend requests will appear here</Text>
            </View>
          }
        />
      )}

      {activeTab === 'trades' && (
        <FlatList
          data={trades}
          renderItem={renderTrade}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="swap-horizontal-outline" size={40} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>No pending trades</Text>
              <Text style={styles.emptySubtext}>Trade requests will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F5F0E5',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    color: '#AAA',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#E0D5C0',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  redBadge: {
    backgroundColor: '#dc2626',
  },
  orangeBadge: {
    backgroundColor: '#f97316',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    borderStyle: 'dashed',
    gap: 8,
  },
  searchToggleText: {
    color: '#D4A017',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#1A1A1A',
    fontSize: 14,
  },
  searchResults: {
    maxHeight: 200,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alreadyFriend: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingRequest: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    flexGrow: 1,
  },
  sectionHeader: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  friendItem: {
    backgroundColor: '#FFF',
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  online: {
    backgroundColor: '#22c55e',
  },
  offline: {
    backgroundColor: '#DDD',
  },
  friendDetails: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 15,
  },
  friendStatus: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  chatActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  chatActionText: {
    color: '#D4A017',
    fontWeight: '600',
    fontSize: 13,
  },
  removeActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  acceptText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  rejectText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  tradeDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
  },
  tradeColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tradeColumn: {
    flex: 1,
  },
  tradeArrow: {
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  tradeLabel: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  tradeItemText: {
    color: '#1A1A1A',
    fontSize: 13,
    marginBottom: 2,
  },
  tradeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    justifyContent: 'flex-end',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
