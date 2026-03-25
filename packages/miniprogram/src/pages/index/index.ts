// pages/index/index.ts
Page({
  data: {
    features: [
      { icon: '/images/icons/map.svg', title: '探索地图', desc: '在真实世界中寻找虚拟宝藏', gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' },
      { icon: '/images/icons/gem.svg', title: '收集宝藏', desc: '收集各种稀有度的物品', gradient: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)' },
      { icon: '/images/icons/trophy.svg', title: '成就系统', desc: '完成挑战获取奖励', gradient: 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 100%)' },
      { icon: '/images/icons/users.svg', title: '好友互动', desc: '和朋友一起冒险', gradient: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 100%)' }
    ]
  },

  onLoad() {
    const app = getApp<IAppOption>()
    if (app.globalData.isLoggedIn) {
      wx.switchTab({ url: '/pages/map/map' })
    }
  },

  onStartExplore() {
    wx.switchTab({ url: '/pages/map/map' })
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
