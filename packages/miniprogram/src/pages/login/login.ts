// pages/login/login.ts
import { login, register, wechatLogin } from '../../utils/api'

Page({
  data: {
    mode: 'login' as 'login' | 'register',
    email: '',
    password: '',
    username: '',
    loading: false,
    wechatLoading: false,
    passwordStrength: 0,
    passwordStrengthText: '',
    passwordStrengthColors: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB']
  },

  onLoad() {
    const app = getApp<IAppOption>()
    if (app.globalData.isLoggedIn) {
      wx.navigateBack()
    }
  },

  toggleMode() {
    const newMode = this.data.mode === 'login' ? 'register' : 'login'
    this.setData({
      mode: newMode,
      password: '',
      passwordStrength: 0,
      passwordStrengthText: '',
      passwordStrengthColors: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB']
    })
  },

  onEmailInput(e: any) {
    this.setData({ email: e.detail.value })
  },

  onPasswordInput(e: any) {
    const password = e.detail.value
    const strength = this.calcPasswordStrength(password)
    const strengthMap: Record<number, string> = {
      0: '',
      1: '弱',
      2: '一般',
      3: '良好',
      4: '强'
    }
    const colorMap: Record<number, string> = {
      0: '#E5E7EB',
      1: '#EF4444',
      2: '#F59E0B',
      3: '#FBBF24',
      4: '#10B981'
    }

    const colors = [0, 1, 2, 3].map(i => i < strength ? colorMap[strength] : '#E5E7EB')

    this.setData({
      password,
      passwordStrength: strength,
      passwordStrengthText: strengthMap[strength],
      passwordStrengthColors: colors
    })
  },

  calcPasswordStrength(password: string): number {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
    return Math.min(score, 4)
  },

  onUsernameInput(e: any) {
    this.setData({ username: e.detail.value })
  },

  async handleSubmit() {
    const { mode, email, password, username } = this.data

    if (!email || !password) {
      wx.showToast({ title: '请填写邮箱和密码', icon: 'none' })
      return
    }

    if (mode === 'register' && !username) {
      wx.showToast({ title: '请填写用户名', icon: 'none' })
      return
    }

    if (mode === 'register' && password.length < 6) {
      wx.showToast({ title: '密码至少需要6位', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: mode === 'login' ? '登录中...' : '注册中...' })

    try {
      const app = getApp<IAppOption>()

      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, username)
      }

      app.globalData.token = wx.getStorageSync('token')
      app.globalData.userInfo = wx.getStorageSync('userInfo')
      app.globalData.isLoggedIn = true

      wx.hideLoading()
      wx.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })

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
