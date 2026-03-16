import api from '@/lib/api';

// ==================== Types ====================

export interface Friend {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requester: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SearchResult {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export interface Conversation {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface TradeItem {
  itemId: string;
  itemName: string;
  itemRarity: string;
  quantity: number;
}

export interface Trade {
  id: string;
  initiatorId: string;
  initiator: {
    id: string;
    username: string;
    avatar?: string;
  };
  receiverId: string;
  receiver: {
    id: string;
    username: string;
    avatar?: string;
  };
  initiatorItems: TradeItem[];
  receiverItems: TradeItem[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// ==================== Friends API ====================

export async function getFriends(): Promise<Friend[]> {
  const response = await api.get<Friend[]>('/friends');
  return response.data;
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const response = await api.get<FriendRequest[]>('/friends/requests');
  return response.data;
}

export async function sendFriendRequest(userId: string): Promise<void> {
  await api.post('/friends/request', { userId });
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.post(`/friends/accept/${requestId}`);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await api.post(`/friends/reject/${requestId}`);
}

export async function searchUsers(query: string): Promise<SearchResult[]> {
  const response = await api.get<SearchResult[]>('/friends/search', { params: { q: query } });
  return response.data;
}

export async function removeFriend(friendId: string): Promise<void> {
  await api.delete(`/friends/${friendId}`);
}

// ==================== Chat API ====================

export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>('/chat/conversations');
  return response.data;
}

export async function getMessages(userId: string): Promise<Message[]> {
  const response = await api.get<Message[]>(`/chat/conversations/${userId}`);
  return response.data;
}

export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const response = await api.post<Message>('/chat/send', { receiverId, content });
  return response.data;
}

export async function markMessagesAsRead(userId: string): Promise<void> {
  await api.post(`/chat/read/${userId}`);
}

// ==================== Trade API ====================

export async function getTrades(): Promise<Trade[]> {
  const response = await api.get<Trade[]>('/trades');
  return response.data;
}

export async function createTrade(data: {
  receiverId: string;
  initiatorItems: { itemId: string; quantity: number }[];
  receiverItems: { itemId: string; quantity: number }[];
}): Promise<Trade> {
  const response = await api.post<Trade>('/trades', data);
  return response.data;
}

export async function acceptTrade(tradeId: string): Promise<void> {
  await api.post(`/trades/${tradeId}/accept`);
}

export async function rejectTrade(tradeId: string): Promise<void> {
  await api.post(`/trades/${tradeId}/reject`);
}