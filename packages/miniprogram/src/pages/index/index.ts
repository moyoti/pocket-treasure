// pages/index/index.ts
Page({
  data: {
    features: [
      { icon: '🗺️', title: '探索地图', desc: '发现附近的宝藏' },
      { icon: '💎', title: '收集宝藏', desc: '稀有宝物等你来拿' },
      { icon: '🏆', title: '成就系统', desc: '解锁各种成就' },
      { icon: '👥', title: '好友互动', desc: '一起寻宝更有趣' }
    ]
  },

  onLoad() {
    // 检查是否已登录，已登录则跳转到地图
    const app = getApp<IAppOption>()
    if (app.globalData.isLoggedIn) {
      wx.switchTab({ url: '/pages/map/map' })
    }
  },

  onStartExplore() {
    // 直接进入地图探索
    wx.switchTab({ url: '/pages/map/map' })
  },

  onLogin() {
    // 跳转到登录页
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
