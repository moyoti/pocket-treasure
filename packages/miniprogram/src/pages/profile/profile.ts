// pages/profile/profile.ts
import { getCoinBalance, getUserStats } from '../../utils/api'
import { checkLogin } from '../../utils/util'

Page({
  data: {
    userInfo: null as any,
    balance: 0,
    stats: null as any,
    isLoggedIn: false,
    avatarLetter: '探',
    totalItems: 0,
    completedAchievements: 0,
    friendCount: 0,
    menuItems: [
      { icon: '/images/icons/store.svg', label: '商店', path: '/pages/shop/shop', color: '#EA580C' },
      { icon: '/images/icons/dices.svg', label: '抽奖', path: '/pages/gacha/gacha', color: '#9333EA' },
      { icon: '/images/icons/trending-up.svg', label: '市场', path: '/pages/market/market', color: '#16A34A' },
      { icon: '/images/icons/users.svg', label: '好友', path: '/pages/friends/friends', color: '#2563EB' },
      { icon: '/images/icons/message-circle.svg', label: '聊天', path: '/pages/chat/chat', color: '#0891B2' },
      { icon: '/images/icons/trophy.svg', label: '成就', path: '/pages/achievements/achievements', color: '#CA8A04' },
      { icon: '/images/icons/bar-chart.svg', label: '统计', path: '/pages/profile-stats/profile-stats', color: '#4F46E5' },
      { icon: '/images/icons/settings.svg', label: '设置', path: '/pages/profile-settings/profile-settings', color: '#6B7280' },
      { icon: '/images/icons/help-circle.svg', label: '帮助', path: '/pages/profile-help/profile-help', color: '#0891B2' },
      { icon: '/images/icons/info.svg', label: '关于', path: '/pages/profile-about/profile-about', color: '#475569', extra: 'v1.0.0' }
    ]
  },

  onLoad() {
    this.setData({ isLoggedIn: checkLogin() })
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() })
    if (checkLogin()) {
      this.loadUserInfo()
      this.loadData()
    }
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    const avatarLetter = userInfo && userInfo.username ? userInfo.username[0].toUpperCase() : '探'
    this.setData({ userInfo, avatarLetter })
  },

  async loadData() {
    try {
      const [balanceRes, statsRes] = await Promise.all([
        getCoinBalance(),
        getUserStats()
      ])
      this.setData({
        balance: balanceRes.balance || 0,
        stats: statsRes,
        totalItems: statsRes && statsRes.collection ? statsRes.collection.totalItems || 0 : 0,
        completedAchievements: statsRes && statsRes.achievements ? statsRes.achievements.completed || 0 : 0,
        friendCount: statsRes && statsRes.friends ? statsRes.friends : 0,
      })
    } catch (err) {
      console.error('加载数据失败:', err)
    }
  },

  navigateTo(e: any) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({ url: path })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          const app = getApp<IAppOption>()
          app.globalData.isLoggedIn = false
          app.globalData.token = undefined
          app.globalData.userInfo = undefined

          this.setData({
            isLoggedIn: false,
            userInfo: null,
            balance: 0,
            stats: null
          })

          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
