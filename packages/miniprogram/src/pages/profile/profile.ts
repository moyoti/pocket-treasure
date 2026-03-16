// pages/profile/profile.ts
import { getCoinBalance, getUserStats } from '../../utils/api'
import { checkLogin } from '../../utils/util'

Page({
  data: {
    userInfo: null as any,
    balance: 0,
    stats: null as any,
    isLoggedIn: false,
    menuItems: [
      { icon: '🏆', label: '成就', path: '/pages/achievements/achievements' },
      { icon: '📋', label: '每日任务', path: '/pages/tasks/tasks' },
      { icon: '👥', label: '好友', path: '/pages/friends/friends' },
      { icon: '💬', label: '聊天', path: '/pages/chat/chat' },
      { icon: '🎲', label: '抽奖', path: '/pages/gacha/gacha' }
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
    this.setData({ userInfo })
  },

  async loadData() {
    try {
      const [balanceRes, statsRes] = await Promise.all([
        getCoinBalance(),
        getUserStats()
      ])
      this.setData({
        balance: balanceRes.balance || 0,
        stats: statsRes
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
