// app.ts
interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo
    token?: string
    isLoggedIn: boolean
    apiBaseUrl: string
    isCloud: boolean
    cloudEnv: string
  }
  checkLogin(): boolean
  requireLogin(): Promise<boolean>
  doLogin(): Promise<void>
  logout(): void
}

// 环境配置
const CLOUD_ENV_ID = 'prod-2ghrq2ok704c1590'
// @ts-ignore __wxConfig is a WeChat DevTools global
const isDev = typeof __wxConfig !== 'undefined' && __wxConfig.envVersion === 'develop'
// 开发环境用公网 URL（wx.request），真机用 callContainer（自动注入 openid）
const useCloud = !isDev
const DEV_API_URL = 'https://treasure-backend-234536-7-1411994450.sh.run.tcloudbase.com/api'
const PROD_API_URL = '' // 生产环境使用云托管，无需配置域名

App<IAppOption>({
  globalData: {
    userInfo: undefined,
    token: undefined,
    isLoggedIn: false,
    apiBaseUrl: useCloud ? PROD_API_URL : DEV_API_URL,
    isCloud: useCloud,
    cloudEnv: CLOUD_ENV_ID,
  },

  onLaunch() {
    // 初始化云开发
    if (useCloud && wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true,
      })
    }

    // 检查是否有缓存的登录状态，但不强制登录
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    }

    // 检查更新
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
  },

  checkLogin(): boolean {
    return this.globalData.isLoggedIn
  },

  async requireLogin(): Promise<boolean> {
    if (this.globalData.isLoggedIn) {
      return true
    }
    
    // 显示登录提示
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
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  async doLogin(): Promise<void> {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  logout() {
    this.globalData.token = undefined
    this.globalData.userInfo = undefined
    this.globalData.isLoggedIn = false
    
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  }
})
