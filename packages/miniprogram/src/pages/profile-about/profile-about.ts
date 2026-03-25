// pages/profile-about/profile-about.ts

Page({
  data: {
    version: 'v1.0.0',
    techStack: [
      { name: 'Web 前端', tech: 'Next.js 14' },
      { name: '移动端', tech: 'React Native + Expo' },
      { name: '小程序', tech: '微信原生框架' },
      { name: '后端', tech: 'NestJS' },
      { name: '数据库', tech: 'PostgreSQL + PostGIS' },
      { name: '地图服务', tech: '高德地图' },
    ],
  },

  goBack() {
    wx.navigateBack()
  },

  copyEmail() {
    wx.setClipboardData({
      data: 'support@treasurehunt.game',
      success: () => {
        wx.showToast({ title: '邮箱已复制', icon: 'success' })
      }
    })
  }
})
