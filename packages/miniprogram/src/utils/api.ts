// utils/api.ts
// API 请求封装 - 支持开发环境 wx.request 和生产环境 wx.cloud.callContainer

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  needAuth?: boolean
}

interface ApiResponse<T = any> {
  statusCode: number
  data: T
}

// 获取 app 实例配置
function getAppConfig() {
  const app = getApp<IAppOption>()
  return {
    apiBaseUrl: app.globalData.apiBaseUrl,
    isCloud: app.globalData.isCloud,
    cloudEnv: app.globalData.cloudEnv,
  }
}

// 获取存储的 token
function getToken(): string {
  return wx.getStorageSync('token') || ''
}

// 通过云托管调用容器
async function cloudRequest<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, needAuth = true } = options
  const { cloudEnv } = getAppConfig()

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (needAuth) {
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: cloudEnv },
      service: 'treasure-backend',
      path: `/api${url}`,
      method: method as any,
      header,
      data,
      success: (res: any) => {
        console.log(`[Cloud API] ${method} ${url} => ${res.statusCode}`, JSON.stringify(res.data).slice(0, 200))
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          const errorData = res.data as any
          const errMsg = errorData?.message || '登录已过期'
          console.error('[API 401]', url, errMsg, JSON.stringify(res.data))
          if (needAuth) {
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
          }
          reject(new Error(errMsg))
        } else {
          const errorData = res.data as any
          console.error(`[API ${res.statusCode}]`, url, JSON.stringify(res.data))
          reject(new Error(errorData?.message || '请求失败'))
        }
      },
      fail: (err: any) => {
        console.error('[Cloud API fail]', url, err)
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

// 通过 wx.request 调用（开发环境）
async function localRequest<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, needAuth = true } = options
  const { apiBaseUrl } = getAppConfig()

  const header: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (needAuth) {
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data as T)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.reLaunch({ url: '/pages/index/index' })
          reject(new Error('登录已过期，请重新登录'))
        } else {
          const errorData = res.data as any
          reject(new Error(errorData?.message || '请求失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'))
      }
    })
  })
}

// 通用请求方法 - 自动选择调用方式
async function request<T = any>(options: RequestOptions): Promise<T> {
  const { isCloud } = getAppConfig()
  if (isCloud) {
    return cloudRequest<T>(options)
  }
  return localRequest<T>(options)
}

// ==================== 认证 API ====================
export async function login(email: string, password: string) {
  const res = await request<{ user: any; token: string }>({
    url: '/auth/login',
    method: 'POST',
    data: { email, password },
    needAuth: false
  })
  
  wx.setStorageSync('token', res.token)
  wx.setStorageSync('userInfo', res.user)
  
  return res
}

export async function register(email: string, password: string, username: string) {
  return request<{ user: any; token: string }>({
    url: '/auth/register',
    method: 'POST',
    data: { email, password, username },
    needAuth: false
  })
}

export async function wechatLogin(code: string) {
  const res = await request<{ user: any; token: string }>({
    url: '/auth/wechat-login',
    method: 'POST',
    data: { code },
    needAuth: false
  })
  
  wx.setStorageSync('token', res.token)
  wx.setStorageSync('userInfo', res.user)
  
  return res
}

// ==================== 宝藏 API ====================
export async function getNearbyItems(lat: number, lng: number, radius: number = 5) {
  return request<any[]>({
    url: '/spawned-items/nearby',
    data: { lat, lng, radius }
  })
}

export async function collectItem(spawnedItemId: string, lat: number, lng: number) {
  return request<any>({
    url: '/spawned-items/collect',
    method: 'POST',
    data: { spawnedItemId, latitude: lat, longitude: lng }
  })
}

// ==================== 背包 API ====================
export async function getInventory() {
  return request<any[]>({ url: '/inventory' })
}

export async function getInventoryStats() {
  return request<any>({ url: '/inventory/stats' })
}

// ==================== 商店 API ====================
export async function getShopItems() {
  return request<{ items: any[] }>({ url: '/shop/items' })
}

export async function purchaseItem(shopItemId: string, quantity: number = 1) {
  return request<any>({
    url: '/shop/purchase',
    method: 'POST',
    data: { shopItemId, quantity }
  })
}

// ==================== 抽奖 API ====================
export async function getGachaPools() {
  return request<any[]>({ url: '/gacha/pools' })
}

export async function pullGacha(poolId: string, pullType: 'single' | 'ten' = 'single') {
  return request<any>({
    url: '/gacha/pull',
    method: 'POST',
    data: { poolId, pullType }
  })
}

// ==================== 成就 API ====================
export async function getUserAchievements() {
  return request<any[]>({ url: '/achievements/me' })
}

export async function claimAchievementReward(achievementId: string) {
  return request<any>({
    url: `/achievements/claim/${achievementId}`,
    method: 'POST'
  })
}

// ==================== 每日任务 API ====================
export async function getDailyTasks() {
  return request<{ tasks: any[]; stats: any }>({ url: '/daily-tasks' })
}

export async function claimTaskReward(taskId: string) {
  return request<any>({
    url: `/daily-tasks/claim/${taskId}`,
    method: 'POST'
  })
}

// ==================== 排行榜 API ====================
export async function getLeaderboard() {
  return request<any[]>({ url: '/leaderboard' })
}

// ==================== 好友 API ====================
export async function getFriends() {
  const res = await request<any[]>({ url: '/friends' })
  return res.map((item: any) => ({
    id: item.user.id,
    username: item.user.username,
    email: item.user.email,
    avatar: item.user.avatar,
    isOnline: item.user.isOnline || false
  }))
}

export async function getFriendRequests() {
  const res = await request<{ received: any[] }>({ url: '/friends/requests' })
  return res.received.map((item: any) => ({
    id: item.id,
    requesterId: item.requesterId,
    requester: {
      id: item.requester?.id || item.requesterId,
      username: item.requester?.username || 'Unknown',
      email: item.requester?.email || '',
      avatar: item.requester?.avatar
    }
  }))
}

export async function sendFriendRequest(userId: string) {
  return request<void>({
    url: '/friends/request',
    method: 'POST',
    data: { addresseeId: userId }
  })
}

export async function acceptFriendRequest(requestId: string) {
  return request<void>({
    url: `/friends/accept/${requestId}`,
    method: 'POST'
  })
}

export async function rejectFriendRequest(requestId: string) {
  return request<void>({
    url: `/friends/reject/${requestId}`,
    method: 'POST'
  })
}

export async function searchUsers(query: string) {
  const res = await request<any[]>({
    url: '/friends/search',
    data: { query }
  })
  return res.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    isFriend: false,
    hasPendingRequest: false
  }))
}

// ==================== 聊天 API ====================
export async function getConversations() {
  return request<any[]>({ url: '/chat/conversations' })
}

export async function getMessages(userId: string) {
  return request<any[]>({ url: `/chat/conversations/${userId}` })
}

export async function sendMessage(receiverId: string, content: string) {
  return request<any>({
    url: '/chat/send',
    method: 'POST',
    data: { receiverId, content }
  })
}

export async function markMessagesAsRead(userId: string) {
  return request<void>({
    url: `/chat/read/${userId}`,
    method: 'POST'
  })
}

// ==================== 用户 API ====================
export async function getUserStats() {
  return request<any>({ url: '/users/stats' })
}

export async function updateUserProfile(data: any) {
  return request<any>({
    url: '/users/me',
    method: 'PATCH',
    data
  })
}

// ==================== 经济 API ====================
export async function getCoinBalance() {
  return request<any>({ url: '/economy/balance' })
}

export async function sellItem(inventoryItemId: string, quantity: number) {
  return request<any>({
    url: '/economy/sell',
    method: 'POST',
    data: { inventoryItemId, quantity }
  })
}

// ==================== 市场 API ====================
export async function getMarketListings(params?: any) {
  return request<{ listings: any[] }>({
    url: '/market/listings',
    data: params
  })
}

export async function buyMarketListing(listingId: string) {
  return request<any>({
    url: `/market/buy/${listingId}`,
    method: 'POST'
  })
}

export async function createMarketListing(inventoryItemId: string, quantity: number, price: number) {
  return request<any>({
    url: '/market/list',
    method: 'POST',
    data: { inventoryItemId, quantity, price }
  })
}

export async function cancelMarketListing(listingId: string) {
  return request<any>({
    url: `/market/cancel/${listingId}`,
    method: 'POST'
  })
}

export async function getMyListings() {
  return request<any[]>({ url: '/market/my-listings' })
}
