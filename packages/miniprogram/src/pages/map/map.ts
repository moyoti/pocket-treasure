// pages/map/map.ts
import { getNearbyItems, collectItem, getCoinBalance } from '../../utils/api'
import { showLoading, hideLoading, showToast, getLocation, requireLogin, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'

interface Item {
  id: string
  itemId: string
  name: string
  description: string
  rarity: string
  latitude: number
  longitude: number
  expiresAt: string
}

Page({
  data: {
    latitude: 39.90469,
    longitude: 116.40717,
    scale: 16,
    items: [] as Item[],
    balance: 0,
    loading: true,
    selectedItem: null as Item | null,
    showItemModal: false,
    collectLoading: false,
    hasLocation: false,
    isLoggedIn: false
  },

  onLoad() {
    this.setData({ isLoggedIn: checkLogin() })
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() })
    this.getLocationAndItems()
    if (checkLogin()) {
      this.loadBalance()
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

  async getLocationAndItems() {
    this.setData({ loading: true })
    
    try {
      const location = await getLocation()
      this.setData({
        latitude: location.latitude,
        longitude: location.longitude,
        hasLocation: true
      })
      
      await this.loadItems()
    } catch (err: any) {
      console.error('获取位置失败:', err)
      this.setData({ loading: false })
      
      wx.showModal({
        title: '需要位置权限',
        content: '请在设置中开启位置权限，以便查找附近的宝藏',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting()
          }
        }
      })
    }
  },

  async loadItems() {
    try {
      const { latitude, longitude } = this.data
      const items = await getNearbyItems(latitude, longitude, 5)
      
      // 如果未登录，items 可能是空数组或模拟数据
      const markers = (items || []).map((item: any, index: number) => ({
        id: index,
        itemId: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        width: 40,
        height: 40,
        iconPath: this.getMarkerIcon(item.item?.rarity || 'common'),
        callout: {
          content: item.item?.name || '宝藏',
          color: '#333',
          fontSize: 12,
          borderRadius: 10,
          bgColor: '#FFD93D',
          padding: 8,
          display: 'ALWAYS'
        }
      }))
      
      this.setData({ 
        items: items || [],
        markers: markers,
        loading: false
      })
    } catch (err) {
      console.error('获取宝藏失败:', err)
      // 未登录时显示模拟数据或空状态
      this.setData({ 
        items: [],
        markers: [],
        loading: false 
      })
    }
  },

  getMarkerIcon(rarity: string): string {
    const icons: Record<string, string> = {
      common: '/images/treasure-common.png',
      rare: '/images/treasure-rare.png',
      epic: '/images/treasure-epic.png',
      legendary: '/images/treasure-legendary.png'
    }
    return icons[rarity] || icons.common
  },

  onMapTap(e: any) {
    if (this.data.showItemModal) {
      this.setData({ showItemModal: false, selectedItem: null })
    }
  },

  onMarkerTap(e: any) {
    const markerId = e.detail.markerId || e.markerId
    const item = this.data.items[markerId]
    
    if (item) {
      this.setData({
        selectedItem: item,
        showItemModal: true
      })
    }
  },

  async handleCollect() {
    const { selectedItem, latitude, longitude } = this.data
    
    if (!selectedItem) return
    
    // 检查登录状态
    const loggedIn = await requireLogin()
    if (!loggedIn) return
    
    this.setData({ collectLoading: true })
    showLoading('收集中...')
    
    try {
      const result = await collectItem(selectedItem.id, latitude, longitude)
      hideLoading()
      
      wx.showModal({
        title: '🎉 收集成功！',
        content: `获得 ${selectedItem.item?.name || '宝藏'}\n金币 +${result.rewards?.coins || 0}`,
        showCancel: false,
        confirmText: '太棒了'
      })
      
      this.setData({ isLoggedIn: true })
      this.loadItems()
      this.loadBalance()
      this.setData({ showItemModal: false, selectedItem: null })
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '收集失败，请靠近宝藏')
    } finally {
      this.setData({ collectLoading: false })
    }
  },

  closeModal() {
    this.setData({ showItemModal: false, selectedItem: null })
  },

  onRefresh() {
    this.getLocationAndItems()
    if (checkLogin()) {
      this.loadBalance()
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
