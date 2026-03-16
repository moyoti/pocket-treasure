import axios, { AxiosError } from 'axios';
import { getStoredToken, clearAuth } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      console.warn('Authentication failed, clearing stored credentials');
      await clearAuth();
      // Note: Navigation to login should be handled by the calling component
      // or via a global event/listener pattern
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