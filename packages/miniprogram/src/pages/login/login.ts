// pages/login/login.ts
import { login, register, wechatLogin } from '../../utils/api'

Page({
  data: {
    isLogin: true,
    email: '',
    password: '',
    username: '',
    loading: false,
    wechatLoading: false
  },

  onLoad(options: any) {
    // 如果已经登录，直接返回
    const app = getApp<IAppOption>()
    if (app.globalData.isLoggedIn) {
      wx.navigateBack()
      return
    }

    // 自动尝试微信静默登录
    this.handleWechatLogin()
  },

  toggleMode() {
    this.setData({ isLogin: !this.data.isLogin })
  },

  onEmailInput(e: any) {
    this.setData({ email: e.detail.value })
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value })
  },

  onUsernameInput(e: any) {
    this.setData({ username: e.detail.value })
  },

  async handleSubmit() {
    const { isLogin, email, password, username } = this.data
    
    if (!email || !password) {
      wx.showToast({ title: '请填写邮箱和密码', icon: 'none' })
      return
    }
    
    if (!isLogin && !username) {
      wx.showToast({ title: '请填写用户名', icon: 'none' })
      return
    }
    
    this.setData({ loading: true })
    wx.showLoading({ title: isLogin ? '登录中...' : '注册中...' })
    
    try {
      const app = getApp<IAppOption>()
      
      if (isLogin) {
        const res = await login(email, password)
        app.globalData.token = wx.getStorageSync('token')
        app.globalData.userInfo = wx.getStorageSync('userInfo')
        app.globalData.isLoggedIn = true
      } else {
        const res = await register(email, password, username)
        app.globalData.token = wx.getStorageSync('token')
        app.globalData.userInfo = wx.getStorageSync('userInfo')
        app.globalData.isLoggedIn = true
      }
      
      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })
      
      // 返回上一页或跳转到地图
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        } else {
          wx.switchTab({ url: '/pages/map/map' })
        }
      }, 500)
    } catch (err: any) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async handleWechatLogin() {
    this.setData({ wechatLoading: true })
    wx.showLoading({ title: '微信登录中...' })
    
    try {
      const loginRes = await wx.login()
      if (loginRes.code) {
        const app = getApp<IAppOption>()
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
    // 跳过登录，返回或去地图
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/map/map' })
    }
  }
})
