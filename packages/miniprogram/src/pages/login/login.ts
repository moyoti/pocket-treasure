// pages/login/login.ts
import { wechatLogin } from '../../utils/api'

Page({
  data: {
    wechatLoading: false
  },

  onLoad() {
    const app = getApp<IAppOption>()
    if (app.globalData.isLoggedIn) {
      wx.navigateBack()
    }
  },

  async handleWechatLogin() {
    this.setData({ wechatLoading: true })
    wx.showLoading({ title: '微信登录中...' })

    try {
      const app = getApp<IAppOption>()
      console.log('[WechatLogin] isCloud:', app.globalData.isCloud, 'cloudEnv:', app.globalData.cloudEnv)
      const loginRes = await wx.login()
      console.log('[WechatLogin] wx.login code:', loginRes.code ? loginRes.code.slice(0, 10) + '...' : 'null')
      if (loginRes.code) {
        await wechatLogin(loginRes.code)

        app.globalData.token = wx.getStorageSync('token')
        app.globalData.userInfo = wx.getStorageSync('userInfo')
        app.globalData.isLoggedIn = true

        wx.hideLoading()
        wx.showToast({ title: '登录成功', icon: 'success' })

        setTimeout(() => {
          const pages = getCurrentPages()
          if (pages.length > 1) {
            wx.navigateBack()
          } else {
            wx.switchTab({ url: '/pages/map/map' })
          }
        }, 500)
      }
    } catch (err: any) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '微信登录失败', icon: 'none' })
    } finally {
      this.setData({ wechatLoading: false })
    }
  },

  handleSkip() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/map/map' })
    }
  }
})
