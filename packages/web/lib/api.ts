import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// API Error response type
interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public details?: string | string[];

  constructor(message: string, statusCode: number, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Transform error for consistent handling
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const statusCode = error.response?.status || 500;
    const details = error.response?.data?.message;

    console.error(`API Error [${statusCode}]:`, message);

    return Promise.reject(new ApiError(
      typeof message === 'string' ? message : message.join(', '),
      statusCode,
      details
    ));
  }
);

export default api;

// Auth API
export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const { user, token } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return response.data;
}

export async function register(email: string, password: string, username: string) {
  const response = await api.post('/auth/register', { email, password, username });
  return response.data;
}

export async function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Items API
export async function getNearbyItems(latitude: number, longitude: number, radiusKm: number = 5) {
  const response = await api.get('/spawned-items/nearby', {
    params: { lat: latitude, lng: longitude, radius: radiusKm },
  });
  return response.data;
}

export async function collectItem(spawnedItemId: string, latitude: number, longitude: number) {
  const response = await api.post('/spawned-items/collect', {
    spawnedItemId,
    latitude,
    longitude,
  });
  return response.data;
}

// Inventory API
export async function getInventory() {
  const response = await api.get('/inventory');
  return response.data;
}

export async function getInventoryStats() {
  const response = await api.get('/inventory/stats');
  return response.data;
}

// User Settings API
export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  achievementNotifications: boolean;
  rareItemAlerts: boolean;
  showAllItems: boolean;
  showRarityFilter: boolean;
  autoCollectNearby: boolean;
  defaultZoom: number;
  publicProfile: boolean;
  showOnLeaderboard: boolean;
  shareLocation: boolean;
  darkMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  language: string;
}

export async function updateUserSettings(settings: Partial<UserSettings>) {
  const response = await api.patch('/users/me', { preferences: settings });
  return response.data;
}

export async function getUserSettings() {
  const response = await api.get('/users/me');
  return response.data.preferences || {};
}

// ==================== Friends API ====================

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

export async function getFriends(): Promise<Friend[]> {
  const response = await api.get('/friends');
  // Backend returns { user, friendship }[], transform to Friend[]
  const data = response.data || [];
  return data.map((item: any) => ({
    id: item.user.id,
    username: item.user.username,
    email: item.user.email,
    avatar: item.user.avatar,
    isOnline: item.user.isOnline || false,
    lastSeenAt: item.user.lastSeenAt,
    createdAt: item.friendship.createdAt,
  }));
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const response = await api.get('/friends/requests');
  // Backend returns { received: Friendship[], sent: Friendship[] }
  const received = response.data.received || [];
  // Transform Friendship to FriendRequest
  return received.map((item: any) => ({
    id: item.id,
    requesterId: item.requesterId,
    requester: {
      id: item.requesterId,
      username: item.requester?.username || 'Unknown',
      email: item.requester?.email || '',
      avatar: item.requester?.avatar,
    },
    status: item.status,
    createdAt: item.createdAt,
  }));
}

export async function sendFriendRequest(userId: string): Promise<void> {
  await api.post('/friends/request', { addresseeId: userId });
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.post(`/friends/accept/${requestId}`);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await api.post(`/friends/reject/${requestId}`);
}

export async function searchUsers(query: string): Promise<SearchResult[]> {
  const response = await api.get('/friends/search', { params: { query } });
  // Backend returns User[], transform to SearchResult[]
  const users = response.data || [];
  // We need to check friendship status for each user
  return users.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    isFriend: false, // Will need additional API call or backend change to determine
    hasPendingRequest: false, // Will need additional API call or backend change to determine
  }));
}

export async function removeFriend(friendId: string): Promise<void> {
  await api.delete(`/friends/${friendId}`);
}

// ==================== Chat API ====================

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

export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get('/chat/conversations');
  return response.data;
}

export async function getMessages(userId: string): Promise<Message[]> {
  const response = await api.get(`/chat/conversations/${userId}`);
  return response.data;
}

export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const response = await api.post('/chat/send', { receiverId, content });
  return response.data;
}

export async function markMessagesAsRead(userId: string): Promise<void> {
  await api.post(`/chat/read/${userId}`);
}

// ==================== Trade API ====================

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

export async function getTrades(): Promise<Trade[]> {
  const response = await api.get('/trades');
  return response.data;
}

export async function createTrade(data: {
  receiverId: string;
  initiatorItems: { itemId: string; quantity: number }[];
  receiverItems: { itemId: string; quantity: number }[];
}): Promise<Trade> {
  const response = await api.post('/trades', data);
  return response.data;
}

export async function acceptTrade(tradeId: string): Promise<void> {
  await api.post(`/trades/${tradeId}/accept`);
}

export async function rejectTrade(tradeId: string): Promise<void> {
  await api.post(`/trades/${tradeId}/reject`);
}

// ==================== Daily Tasks API ====================

export async function getDailyTasks() {
  const response = await api.get('/daily-tasks');
  return response.data;
}

export async function claimTaskReward(taskId: string) {
  const response = await api.post(`/daily-tasks/claim/${taskId}`);
  return response.data;
}

export async function refreshDailyTasks() {
  const response = await api.post('/daily-tasks/refresh');
  return response.data;
}

export async function getDailyTaskStats() {
  const response = await api.get('/daily-tasks/stats');
  return response.data;
}

// ==================== Achievements API ====================

export async function getAchievements() {
  const response = await api.get('/achievements');
  return response.data;
}

export async function getUserAchievements() {
  const response = await api.get('/achievements/me');
  return response.data;
}

export async function claimAchievementReward(achievementId: string) {
  const response = await api.post(`/achievements/claim/${achievementId}`);
  return response.data;
}

// ==================== User Stats API ====================

export async function getUserStats() {
  const response = await api.get('/users/stats');
  return response.data;
}

// ==================== Economy API ====================

export async function getCoinBalance() {
  const response = await api.get('/economy/balance');
  return response.data;
}

export async function getCoinStats() {
  const response = await api.get('/economy/stats');
  return response.data;
}

export async function sellItemToNPC(data: { inventoryItemId: string; quantity: number }) {
  const response = await api.post('/economy/sell', data);
  return response.data;
}

export async function sellItemsToNPC(items: { inventoryItemId: string; quantity: number }[]) {
  const response = await api.post('/economy/sell-batch', { items });
  return response.data;
}

// ==================== Shop API ====================

export async function getShopItems() {
  const response = await api.get('/shop/items');
  return response.data.items || [];
}

export async function purchaseShopItem(data: { shopItemId: string; quantity: number }) {
  const response = await api.post('/shop/purchase', data);
  return response.data;
}

// ==================== Chest API ====================

export async function getChests() {
  const response = await api.get('/chests');
  return response.data;
}

export async function openChest(data: { chestId: string }) {
  const response = await api.post('/chests/open', data);
  return response.data;
}

// ==================== Gacha API ====================

export async function getGachaPools() {
  const response = await api.get('/gacha/pools');
  return response.data;
}

export async function pullGacha(data: { poolId: string; pullType?: 'single' | 'ten' }) {
  const response = await api.post('/gacha/pull', data);
  return response.data;
}

// ==================== Market API ====================

export async function getMarketListings(params?: {
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get('/market/listings', { params });
  return response.data.listings || [];
}

export async function getMyListings() {
  const response = await api.get('/market/my/listings');
  return response.data;
}

export async function createMarketListing(data: { inventoryItemId: string; quantity: number; price: number }) {
  const response = await api.post('/market/list', data);
  return response.data;
}

export async function buyMarketListing(listingId: string) {
  const response = await api.post(`/market/buy/${listingId}`);
  return response.data;
}

export async function cancelMarketListing(listingId: string) {
  const response = await api.post(`/market/cancel/${listingId}`);
  return response.data;
}