// pages/shop/shop.ts
import { getShopItems, purchaseItem, getCoinBalance } from '../../utils/api'
import { showToast, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'
import { t } from '../../utils/i18n'

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
    // Localized strings
    locale: {
      title: 'NPC商店',
      loginToBuy: '登录购买',
      emptyShop: '商店暂无商品',
      emptyShopHint: '请稍后再来看看！',
      confirmPurchase: '确认购买',
      total: '总计',
      soldOut: '已售罄',
      coinsInsufficient: '金币不足',
      purchase: '购买',
      cancel: '取消',
      confirm: '确认',
      purchasing: '购买中...',
      purchaseSuccess: '购买成功！',
      ok: '确定',
    },
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
    this.initLocaleStrings()
    this.loadData()
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() })
    this.initLocaleStrings()
    if (checkLogin()) {
      this.loadBalance()
    }
  },

  initLocaleStrings() {
    this.setData({
      locale: {
        title: t('shop.title'),
        loginToBuy: t('shop.loginToBuy'),
        emptyShop: t('shop.emptyShop'),
        emptyShopHint: t('shop.emptyShopHint'),
        confirmPurchase: t('shop.confirmPurchase'),
        total: t('shop.total'),
        soldOut: t('common.soldOut'),
        coinsInsufficient: t('common.coinsInsufficient'),
        purchase: t('common.purchase'),
        cancel: t('common.cancel'),
        confirm: t('common.confirm'),
        purchasing: t('shop.purchasing'),
        purchaseSuccess: t('common.purchaseSuccess'),
        ok: t('common.close'),
      }
    })
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
          limitText: item.purchaseLimit && item.purchaseLimit > 0 
            ? t('shop.itemLimit', { limit: item.purchaseLimit }) 
            : t('shop.noItemLimit'),
          isAvailable: item.isAvailable !== false,
        }
      })

      this.setData({ items, loading: false })
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'Failed to load')
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
      showToast(t('common.coinsInsufficient'))
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
        successMessage: t('shop.purchaseSuccessMsg', { count: purchaseQty, name: purchaseItemData.name }),
      })

      this.loadBalance()
      this.loadData()
    } catch (err) {
      const error = err as Error
      this.setData({ purchaseLoading: false })
      showToast(error.message || t('common.purchaseFailed'))
    }
  },

  closeSuccessModal() {
    this.setData({ successModalOpen: false })
  },

  getButtonText(item: ShopItem): string {
    if (!item.isAvailable) return t('common.soldOut')
    if (this.data.balance < item.price) return t('common.coinsInsufficient')
    return t('common.purchase')
  },
})
