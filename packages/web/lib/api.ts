import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
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