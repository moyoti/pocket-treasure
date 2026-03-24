// pages/map/map.ts
import { getNearbyItems, collectItem, getCoinBalance } from '../../utils/api'
import { showToast, getLocation, checkLogin, calculateDistance } from '../../utils/util'

const COLLECTION_RADIUS_METERS = 50

interface MapItem {
  id: string
  itemId: string
  name: string
  description: string
  rarity: string
  latitude: number
  longitude: number
  expiresAt: string
  item?: {
    name: string
    description: string
    rarity: string
  }
}

Page({
  data: {
    latitude: 39.90469,
    longitude: 116.40717,
    scale: 16,
    items: [] as MapItem[],
    markers: [] as any[],
    circles: [] as any[],

    balance: 0,
    loading: true,
    selectedItem: null as MapItem | null,
    showItemModal: false,
    collectLoading: false,
    hasLocation: false,
    isLoggedIn: false,
    showItemPool: false,
    coordText: '定位中...',
    itemDistance: '',
    showCollectSuccess: false,
    collectedItemName: '',
    collectedItemRarity: '',
    collectedCoins: 0,
    refreshing: false,
    rarityLegend: [
      { name: '普通', color: '#6B7280' },
      { name: '稀有', color: '#0EA5E9' },
      { name: '史诗', color: '#8B5CF6' },
      { name: '传说', color: '#F59E0B' }
    ],
    collectionRadius: COLLECTION_RADIUS_METERS,

    // 疯狂点击收集相关状态
    showCollecting: false,
    collectProgress: 0,
    collectTaps: 0,
    collectTarget: 15,
    collectRarityColor: '#6B7280',
    tapEffects: [] as { id: number; x: number; y: number; color: string }[],
    tapEffectId: 0,
    comboCount: 0,
    lastTapTime: 0
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

  formatCoord(lat: number, lng: number): string {
    return lat.toFixed(4) + ', ' + lng.toFixed(4)
  },

  async getLocationAndItems() {
    this.setData({ loading: true })

    try {
      const location = await getLocation()
      this.setData({
        latitude: location.latitude,
        longitude: location.longitude,
        hasLocation: true,
        coordText: this.formatCoord(location.latitude, location.longitude)
      })

      if (checkLogin()) {
        await this.loadItems()
      } else {
        this.setData({ loading: false })
      }
    } catch (err: any) {
      console.error('获取位置失败:', err)
      this.setData({
        loading: false,
        coordText: '定位失败'
      })

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

      const rarityOrder: Record<string, number> = {
        legendary: 0,
        epic: 1,
        rare: 2,
        common: 3
      }

      const sortedItems = [...(items || [])].sort((a, b) => {
        const orderA = rarityOrder[a.itemRarity] ?? 3
        const orderB = rarityOrder[b.itemRarity] ?? 3
        return orderA - orderB
      }).map((item: any) => ({
        ...item,
        item: {
          name: '神秘宝藏',
          description: item.poiName ? `在${item.poiName}发现的宝藏` : '一个神秘的宝藏',
          rarity: item.itemRarity || 'common'
        }
      }))

      const markers = sortedItems.map((item: any, index: number) => ({
        id: index,
        itemId: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        width: 50,
        height: 50,
        iconPath: this.getMarkerIcon(item.item.rarity),
        anchor: { x: 0.5, y: 0.5 }
      }))

      const circles = sortedItems.map((item: any, index: number) => ({
        id: index,
        latitude: item.latitude,
        longitude: item.longitude,
        radius: COLLECTION_RADIUS_METERS,
        strokeColor: this.getRarityColor(item.item.rarity),
        fillColor: this.getRarityColor(item.item.rarity) + '30',
        strokeWidth: 3
      }))

      this.setData({
        items: sortedItems,
        markers: markers,
        circles: circles,
        loading: false
      })
    } catch (err) {
      console.error('获取宝藏失败:', err)
      this.setData({
        items: [],
        markers: [],
        circles: [],
        loading: false
      })
    }
  },

  getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      common: '#6B7280',
      rare: '#0EA5E9',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    }
    return colors[rarity] || colors.common
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
      return
    }

    const detail = e.detail || {}
    const tapLat = detail.latitude
    const tapLng = detail.longitude

    if (!tapLat || !tapLng) return

    let nearestItem = null
    let nearestDist = Infinity

    for (const item of this.data.items) {
      const dist = calculateDistance(tapLat, tapLng, item.latitude, item.longitude)
      if (dist < nearestDist && dist <= COLLECTION_RADIUS_METERS) {
        nearestDist = dist
        nearestItem = item
      }
    }

    if (nearestItem) {
      let distText = ''
      if (nearestDist < 1000) {
        distText = Math.round(nearestDist) + '米'
      } else {
        distText = (nearestDist / 1000).toFixed(1) + '公里'
      }

      this.setData({
        selectedItem: nearestItem,
        showItemModal: true,
        itemDistance: distText
      })
    }
  },

  onMarkerTap(e: any) {
    const markerId = e.detail.markerId || e.markerId
    console.log('Marker tap - markerId:', markerId)
    console.log('Available markers:', this.data.markers.map((m: any) => ({ id: m.id, itemId: m.itemId, lat: m.latitude, lng: m.longitude })))
    
    const marker = this.data.markers.find((m: any) => m.id === markerId)
    console.log('Found marker:', marker)
    
    if (!marker) return
    
    const item = this.data.items.find((item: any) => item.id === marker.itemId)
    console.log('Found item:', item ? { id: item.id, name: item.item?.name, rarity: item.item?.rarity } : null)
    if (!item) return

    const dist = calculateDistance(
      this.data.latitude, this.data.longitude,
      marker.latitude, marker.longitude
    )
    let distText = ''
    if (dist < 1000) {
      distText = Math.round(dist) + '米'
    } else {
      distText = (dist / 1000).toFixed(1) + '公里'
    }

    this.setData({
      selectedItem: item,
      showItemModal: true,
      itemDistance: distText
    })
  },

  handleCollect() {
    const { selectedItem } = this.data

    if (!selectedItem) return

    const rarity = selectedItem.item?.rarity || 'common'
    const rarityColors: Record<string, string> = {
      common: '#6B7280',
      rare: '#0EA5E9',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    }

    const tapTargets: Record<string, number> = {
      common: 8,
      rare: 12,
      epic: 18,
      legendary: 25
    }

    this.setData({
      showItemModal: false,
      showCollecting: true,
      collectProgress: 0,
      collectTaps: 0,
      collectTarget: tapTargets[rarity] || 15,
      collectRarityColor: rarityColors[rarity] || '#6B7280',
      tapEffects: [],
      tapEffectId: 0
    })
  },

  handleCollectTap(e: any) {
    const { collectProgress, collectTaps, collectTarget, tapEffects, tapEffectId, lastTapTime, comboCount } = this.data

    if (collectProgress >= 100) return

    const now = Date.now()
    const timeDiff = now - lastTapTime
    const isCombo = timeDiff < 300

    const newCombo = isCombo ? comboCount + 1 : 1
    const newTaps = collectTaps + 1
    const newProgress = Math.min((newTaps / collectTarget) * 100, 100)

    const touch = e.touches && e.touches[0]
    const x = touch ? touch.clientX - 20 : Math.random() * 200 + 50
    const y = touch ? touch.clientY - 20 : Math.random() * 100 + 100

    const colors = ['#FCD34D', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#10B981']
    const color = colors[Math.floor(Math.random() * colors.length)]

    const newEffect = {
      id: tapEffectId + 1,
      x,
      y,
      color
    }

    this.setData({
      collectTaps: newTaps,
      collectProgress: newProgress,
      tapEffects: [...tapEffects.slice(-15), newEffect],
      tapEffectId: tapEffectId + 1,
      comboCount: newCombo,
      lastTapTime: now
    })

    if (newProgress >= 100) {
      this.completeCollection()
    }
  },

  async completeCollection() {
    const { selectedItem, latitude, longitude } = this.data

    if (!selectedItem) return

    try {
      const result = await collectItem(selectedItem.id, latitude, longitude)

      if (!result.success) {
        this.setData({ showCollecting: false })
        let distText = ''
        if (result.distance < 1000) {
          distText = Math.round(result.distance) + '米'
        } else {
          distText = (result.distance / 1000).toFixed(1) + '公里'
        }
        showToast(`距离太远，请靠近至${distText}内`)
        return
      }

      const itemName = result.item?.name || '神秘宝藏'
      const itemRarity = result.item?.rarity || selectedItem.item?.rarity || 'common'
      const coins = result.rewards?.coins || 0

      this.setData({
        showCollecting: false,
        selectedItem: null,
        showCollectSuccess: true,
        collectedItemName: itemName,
        collectedItemRarity: itemRarity,
        collectedCoins: coins,
        isLoggedIn: true
      })

      this.loadItems()
      this.loadBalance()
    } catch (err: any) {
      this.setData({ showCollecting: false })
      showToast(err.message || '收集失败，请靠近宝藏')
    }
  },

  closeCollectingModal() {
    this.setData({ showCollecting: false })
  },

  closeModal() {
    this.setData({ showItemModal: false, selectedItem: null })
  },

  closeSuccessModal() {
    this.setData({ showCollectSuccess: false })
  },

  toggleItemPool() {
    this.setData({ showItemPool: !this.data.showItemPool })
  },

  async onRefresh() {
    this.setData({ refreshing: true })
    await this.getLocationAndItems()
    if (checkLogin()) {
      await this.loadBalance()
    }
    this.setData({ refreshing: false })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
