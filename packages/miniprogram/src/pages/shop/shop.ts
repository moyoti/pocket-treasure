// pages/shop/shop.ts
import { getShopItems, purchaseItem, getCoinBalance } from '../../utils/api'
import { showLoading, hideLoading, showToast, showConfirm, requireLogin, checkLogin } from '../../utils/util'

Page({
  data: {
    items: [] as any[],
    balance: 0,
    loading: true,
    isLoggedIn: false
  },

  onLoad() {
    this.setData({ isLoggedIn: checkLogin() })
    this.loadData()
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() })
    if (checkLogin()) {
      this.loadBalance()
    }
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      const res = await getShopItems()
      this.setData({ items: res.items || [], loading: false })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async loadBalance() {
    try {
      const res = await getCoinBalance()
      this.setData({ balance: res.balance || 0 })
    } catch (err) {
      console.error('获取余额失败:', err)
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  async handlePurchase(e: any) {
    // 检查登录
    const loggedIn = await requireLogin()
    if (!loggedIn) return
    
    const item = e.currentTarget.dataset.item
    
    const confirmed = await showConfirm(`确定要购买 ${item.name} 吗？\n价格：${item.price} 金币`)
    if (!confirmed) return
    
    showLoading('购买中...')
    
    try {
      await purchaseItem(item.id, 1)
      hideLoading()
      showToast('购买成功！', 'success')
      this.loadBalance()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '购买失败')
    }
  }
})
