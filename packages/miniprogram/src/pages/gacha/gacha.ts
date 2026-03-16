// pages/gacha/gacha.ts
import { getGachaPools, pullGacha, getCoinBalance } from '../../utils/api'
import { showLoading, hideLoading, showToast, requireLogin, checkLogin } from '../../utils/util'

Page({
  data: {
    pools: [] as any[],
    selectedPool: null as any,
    balance: 0,
    loading: true,
    pullLoading: false,
    results: [] as any[],
    showResults: false,
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
      const pools = await getGachaPools()
      this.setData({
        pools: pools || [],
        selectedPool: pools?.[0] || null,
        loading: false
      })
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

  selectPool(e: any) {
    const poolId = e.currentTarget.dataset.id
    const pool = this.data.pools.find((p: any) => p.id === poolId)
    this.setData({ selectedPool: pool })
  },

  async handlePull(e: any) {
    // 检查登录
    const loggedIn = await requireLogin()
    if (!loggedIn) return
    
    const pullType = e.currentTarget.dataset.type
    const { selectedPool, balance } = this.data
    
    if (!selectedPool) {
      showToast('请选择抽奖池')
      return
    }
    
    const cost = pullType === 'ten' ? selectedPool.costTen : selectedPool.cost
    if (balance < cost) {
      showToast('金币不足')
      return
    }
    
    this.setData({ pullLoading: true })
    showLoading('抽奖中...')
    
    try {
      const res = await pullGacha(selectedPool.id, pullType)
      hideLoading()
      
      this.setData({
        results: res.items || [],
        showResults: true,
        isLoggedIn: true
      })
      
      this.loadBalance()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '抽奖失败')
    } finally {
      this.setData({ pullLoading: false })
    }
  },

  closeResults() {
    this.setData({ showResults: false, results: [] })
  }
})
