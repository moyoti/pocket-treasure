// utils/util.ts
// 通用工具函数

/**
 * 格式化距离显示
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}米`
  }
  return `${(meters / 1000).toFixed(1)}公里`
}

/**
 * 格式化时间显示
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return dateStr
  }
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return '昨天'
  
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 格式化数字
 */
export function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
  return num.toLocaleString()
}

/**
 * 计算两点间距离（米）
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * 检查是否在收集范围内
 */
export function isInCollectRange(userLat: number, userLng: number, itemLat: number, itemLng: number, radiusMeters: number = 50): boolean {
  return calculateDistance(userLat, userLng, itemLat, itemLng) <= radiusMeters
}

/**
 * 稀有度名称
 */
export const RARITY_NAMES: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

/**
 * 稀有度颜色
 */
export const RARITY_COLORS: Record<string, string> = {
  common: '#6B7280',
  rare: '#0EA5E9',
  epic: '#8B5CF6',
  legendary: '#F59E0B'
}

/**
 * 显示加载中
 */
export function showLoading(title: string = '加载中...') {
  wx.showLoading({ title, mask: true })
}

/**
 * 隐藏加载中
 */
export function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示提示
 */
export function showToast(title: string, icon: 'success' | 'error' | 'none' = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

/**
 * 显示确认框
 */
export function showConfirm(content: string, title: string = '提示'): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false)
    })
  })
}

/**
 * 获取位置
 */
export function getLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 检查登录状态
 */
export function checkLogin(): boolean {
  const app = getApp<IAppOption>()
  return app.globalData.isLoggedIn
}

/**
 * 获取用户信息
 */
export function getUserInfo(): WechatMiniprogram.UserInfo | undefined {
  return wx.getStorageSync('userInfo')
}

/**
 * 需要登录的操作 - 检查登录状态，未登录则提示
 * @returns 是否已登录
 */
export async function requireLogin(): Promise<boolean> {
  const app = getApp<IAppOption>()
  
  if (app.globalData.isLoggedIn) {
    return true
  }
  
  return new Promise((resolve) => {
    wx.showModal({
      title: '提示',
      content: '该功能需要登录后使用，是否立即登录？',
      confirmText: '去登录',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/login/login' })
        }
        resolve(false)
      },
      fail: () => resolve(false)
    })
  })
}

/**
 * 带登录检查的操作包装器
 * @param action 需要执行的操作
 * @returns 操作是否执行
 */
export async function withLogin<T>(action: () => Promise<T>): Promise<T | null> {
  const loggedIn = await requireLogin()
  if (!loggedIn) return null
  return action()
}
