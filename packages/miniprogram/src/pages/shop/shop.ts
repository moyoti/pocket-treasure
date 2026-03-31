// pages/shop/shop.ts
import { getShopItems, purchaseItem, getCoinBalance } from '../../utils/api'
import { showToast, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'

interface ShopItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  rarity?: string
  image?: string
  stock?: number
  isAvailable?: boolean
  metadata?: {
    rarity?: string
  }
  purchaseLimit?: number
}

interface PurchaseItemData extends ShopItem {
  rarityName?: string
  rarityColor?: string
  rarityBgClass?: string
  categoryLabel?: string
  limitText?: string
}

Page({
  data: {
    items: [] as ShopItem[],
    balance: 0,
    loading: true,
    isLoggedIn: false,
    // Purchase modal
    purchaseModalOpen: false,
    purchaseItemData: null as PurchaseItemData | null,
    purchaseQty: 1,
    purchaseMaxQty: 99,
    purchaseUnitPrice: 0,
    purchaseTotalPrice: 0,
    purchaseLoading: false,
    canAfford: true,
    // Success modal
    successModalOpen: false,
    successMessage: '',
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

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const res = await getShopItems()
      const rawItems = res.items || res || []

      const items = rawItems.map((item: ShopItem) => {
        const rarity = (item.metadata && item.metadata.rarity) ? item.metadata.rarity : 'common'
        return {
          ...item,
          rarityName: RARITY_NAMES[rarity] || '普通',
          rarityColor: RARITY_COLORS[rarity] || '#6B7280',
          rarityBgClass: 'rarity-bg-' + rarity,
          categoryLabel: item.category || '道具',
          limitText: item.purchaseLimit > 0 ? ('限购: ' + item.purchaseLimit) : '无限购',
          isAvailable: item.isAvailable !== false,
        }
      })

      this.setData({ items, loading: false })
    } catch (err) {
      const error = err as Error
      showToast(error.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async loadBalance() {
    try {
      const res = await getCoinBalance()
      this.setData({ balance: res.balance || 0 })
    } catch (err) {
      console.error('获取余额失败:', err)
      showToast('获取余额失败')
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  openPurchaseModal(e: { currentTarget: { dataset: { index: number } } }) {
    if (!checkLogin()) {
      this.goToLogin()
      return
    }
    const index = e.currentTarget.dataset.index
    const item = this.data.items[index]
    if (!item) return

    const maxQty = item.purchaseLimit > 0 ? item.purchaseLimit : 99
    const canAfford = this.data.balance >= item.price

    this.setData({
      purchaseModalOpen: true,
      purchaseItemData: item,
      purchaseQty: 1,
      purchaseMaxQty: maxQty,
      purchaseUnitPrice: item.price,
      purchaseTotalPrice: item.price,
      purchaseLoading: false,
      canAfford,
    })
  },

  closePurchaseModal() {
    this.setData({ purchaseModalOpen: false, purchaseItemData: null })
  },

  decreasePurchaseQty() {
    const qty = Math.max(1, this.data.purchaseQty - 1)
    const total = qty * this.data.purchaseUnitPrice
    this.setData({
      purchaseQty: qty,
      purchaseTotalPrice: total,
      canAfford: this.data.balance >= total,
    })
  },

  increasePurchaseQty() {
    const qty = Math.min(this.data.purchaseMaxQty, this.data.purchaseQty + 1)
    const total = qty * this.data.purchaseUnitPrice
    this.setData({
      purchaseQty: qty,
      purchaseTotalPrice: total,
      canAfford: this.data.balance >= total,
    })
  },

  async confirmPurchase() {
    const { purchaseItemData, purchaseQty, purchaseTotalPrice } = this.data
    if (!purchaseItemData) return
    if (this.data.balance < purchaseTotalPrice) {
      showToast('金币不足')
      return
    }

    this.setData({ purchaseLoading: true })

    try {
      await purchaseItem(purchaseItemData.id, purchaseQty)

      this.setData({
        purchaseModalOpen: false,
        purchaseItemData: null,
        purchaseLoading: false,
        successModalOpen: true,
        successMessage: '成功购买 ' + purchaseQty + '个 ' + purchaseItemData.name,
      })

      this.loadBalance()
      this.loadData()
    } catch (err) {
      const error = err as Error
      this.setData({ purchaseLoading: false })
      showToast(error.message || '购买失败')
    }
  },

  closeSuccessModal() {
    this.setData({ successModalOpen: false })
  },

  getButtonText(item: ShopItem): string {
    if (!item.isAvailable) return '已售罄'
    if (this.data.balance < item.price) return '金币不足'
    return '购买'
  },
})
