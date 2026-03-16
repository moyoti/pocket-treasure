// pages/inventory/inventory.ts
import { getInventory, sellItem, getCoinBalance } from '../../utils/api'
import { showLoading, hideLoading, showToast, showConfirm, requireLogin, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'

Page({
  data: {
    items: [] as any[],
    balance: 0,
    loading: true,
    selectionMode: false,
    selectedItems: new Set<string>(),
    isLoggedIn: false
  },

  onLoad() {
    this.setData({ isLoggedIn: checkLogin() })
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() })
    if (checkLogin()) {
      this.loadData()
      this.loadBalance()
    } else {
      this.setData({ loading: false, items: [] })
    }
  },

  onPullDownRefresh() {
    if (checkLogin()) {
      this.loadData().then(() => wx.stopPullDownRefresh())
    } else {
      wx.stopPullDownRefresh()
    }
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      const items = await getInventory()
      this.setData({ items, loading: false })
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

  async toggleSelectionMode() {
    // 检查登录
    const loggedIn = await requireLogin()
    if (!loggedIn) return
    
    const newMode = !this.data.selectionMode
    this.setData({ 
      selectionMode: newMode,
      selectedItems: new Set()
    })
  },

  toggleItemSelection(e: any) {
    const itemId = e.currentTarget.dataset.id
    const selectedItems = new Set(this.data.selectedItems)
    
    if (selectedItems.has(itemId)) {
      selectedItems.delete(itemId)
    } else {
      selectedItems.add(itemId)
    }
    
    this.setData({ selectedItems })
  },

  selectAll() {
    const allIds = this.data.items.map(item => item.id)
    this.setData({ selectedItems: new Set(allIds) })
  },

  async handleSellItem(e: any) {
    // 检查登录
    const loggedIn = await requireLogin()
    if (!loggedIn) return
    
    const item = e.currentTarget.dataset.item
    
    const confirmed = await showConfirm(`确定要出售 ${item.item.name} x${item.quantity} 吗？`)
    if (!confirmed) return
    
    showLoading('出售中...')
    
    try {
      await sellItem(item.id, item.quantity)
      hideLoading()
      showToast('出售成功', 'success')
      this.loadData()
      this.loadBalance()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '出售失败')
    }
  },

  async handleBatchSell() {
    const { items, selectedItems } = this.data
    if (selectedItems.size === 0) {
      showToast('请选择要出售的物品')
      return
    }
    
    const confirmed = await showConfirm(`确定要出售选中的 ${selectedItems.size} 个物品吗？`)
    if (!confirmed) return
    
    showLoading('出售中...')
    
    try {
      for (const itemId of selectedItems) {
        const item = items.find(i => i.id === itemId)
        if (item) {
          await sellItem(itemId, item.quantity)
        }
      }
      hideLoading()
      showToast('出售成功', 'success')
      this.setData({ selectionMode: false, selectedItems: new Set() })
      this.loadData()
      this.loadBalance()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '出售失败')
    }
  }
})
