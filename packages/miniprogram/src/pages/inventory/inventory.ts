// pages/inventory/inventory.ts
import { getInventory, getInventoryStats, sellItem as apiSellItem, getCoinBalance } from '../../utils/api'
import { showLoading, hideLoading, showToast, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'

const NPC_PRICES: Record<string, number> = {
  common: 5,
  rare: 25,
  epic: 100,
  legendary: 500,
}

Page({
  data: {
    items: [] as any[],
    balance: 0,
    loading: true,
    selectionMode: false,
    selectedCount: 0,
    selectedTotalValue: 0,
    isLoggedIn: false,
    // Sell modal
    sellModalOpen: false,
    sellItemData: null as any,
    sellQuantity: 1,
    sellMaxQuantity: 1,
    sellUnitPrice: 0,
    sellTotalPrice: 0,
    sellLoading: false,
    // Success modal
    successModalOpen: false,
    successMessage: '',
    successCoins: 0,
    // Stats display
    totalItems: 0,
    uniqueItems: 0,
    commonCount: 0,
    rareCount: 0,
    epicCount: 0,
    legendaryCount: 0,
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
      const [rawItems, stats] = await Promise.all([
        getInventory(),
        getInventoryStats().catch(() => null),
      ])

      const items = (rawItems || []).map((item: any) => {
        const rarity = (item.item && item.item.rarity) ? item.item.rarity : 'common'
        const npcPrice = NPC_PRICES[rarity] || 5
        return {
          ...item,
          rarityName: RARITY_NAMES[rarity] || '普通',
          rarityColor: RARITY_COLORS[rarity] || '#6B7280',
          rarityBgClass: 'rarity-bg-' + rarity,
          npcPrice: npcPrice,
          totalPrice: npcPrice * (item.quantity || 1),
          selected: false,
        }
      })

      const totalItems = stats ? (stats.totalItems || 0) : items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)
      const uniqueItems = stats ? (stats.uniqueItems || 0) : items.length
      const byRarity = (stats && stats.byRarity) ? stats.byRarity : {}

      this.setData({
        items,
        totalItems,
        uniqueItems,
        commonCount: byRarity.common || 0,
        rareCount: byRarity.rare || 0,
        epicCount: byRarity.epic || 0,
        legendaryCount: byRarity.legendary || 0,
        loading: false,
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

  toggleSelectionMode() {
    if (!checkLogin()) {
      this.goToLogin()
      return
    }
    const newMode = !this.data.selectionMode
    const items = this.data.items.map((i: any) => ({ ...i, selected: false }))
    this.setData({
      selectionMode: newMode,
      items,
      selectedCount: 0,
      selectedTotalValue: 0,
    })
  },

  toggleItemSelection(e: any) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items
    const item = items[index]
    if (!item) return

    const newSelected = !item.selected
    const key = `items[${index}].selected`
    this.setData({ [key]: newSelected } as any)

    // Recalculate
    let selectedCount = 0
    let selectedTotalValue = 0
    for (let i = 0; i < this.data.items.length; i++) {
      const it = this.data.items[i]
      if (it.selected) {
        selectedCount++
        selectedTotalValue += it.totalPrice
      }
    }
    this.setData({ selectedCount, selectedTotalValue })
  },

  selectAll() {
    const items = this.data.items.map((i: any) => ({ ...i, selected: true }))
    const selectedCount = items.length
    const selectedTotalValue = items.reduce((s: number, i: any) => s + i.totalPrice, 0)
    this.setData({ items, selectedCount, selectedTotalValue })
  },

  openSellModal(e: any) {
    if (!checkLogin()) {
      this.goToLogin()
      return
    }
    const index = e.currentTarget.dataset.index
    const item = this.data.items[index]
    if (!item) return

    this.setData({
      sellModalOpen: true,
      sellItemData: item,
      sellQuantity: 1,
      sellMaxQuantity: item.quantity,
      sellUnitPrice: item.npcPrice,
      sellTotalPrice: item.npcPrice,
      sellLoading: false,
    })
  },

  closeSellModal() {
    this.setData({ sellModalOpen: false, sellItemData: null })
  },

  decreaseSellQty() {
    const qty = Math.max(1, this.data.sellQuantity - 1)
    this.setData({
      sellQuantity: qty,
      sellTotalPrice: qty * this.data.sellUnitPrice,
    })
  },

  increaseSellQty() {
    const qty = Math.min(this.data.sellMaxQuantity, this.data.sellQuantity + 1)
    this.setData({
      sellQuantity: qty,
      sellTotalPrice: qty * this.data.sellUnitPrice,
    })
  },

  async confirmSell() {
    const { sellItemData, sellQuantity, sellTotalPrice } = this.data
    if (!sellItemData) return

    this.setData({ sellLoading: true })

    try {
      await apiSellItem(sellItemData.id, sellQuantity)

      const itemName = sellItemData.item ? sellItemData.item.name : '物品'

      this.setData({
        sellModalOpen: false,
        sellItemData: null,
        sellLoading: false,
        successModalOpen: true,
        successMessage: '成功出售 ' + sellQuantity + '个 ' + itemName,
        successCoins: sellTotalPrice,
      })

      this.loadData()
      this.loadBalance()
    } catch (err: any) {
      this.setData({ sellLoading: false })
      showToast(err.message || '出售失败')
    }
  },

  closeSuccessModal() {
    this.setData({ successModalOpen: false })
  },

  async handleBatchSell() {
    const { items, selectedCount, selectedTotalValue } = this.data
    if (selectedCount === 0) {
      showToast('请选择要出售的物品')
      return
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: '批量出售',
        content: '确定以 ' + selectedTotalValue + ' 金币出售 ' + selectedCount + ' 个物品？',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      })
    })
    if (!confirmed) return

    showLoading('出售中...')

    try {
      for (const item of items) {
        if (item.selected) {
          await apiSellItem(item.id, item.quantity)
        }
      }
      hideLoading()

      this.setData({
        selectionMode: false,
        selectedCount: 0,
        selectedTotalValue: 0,
        successModalOpen: true,
        successMessage: '成功出售 ' + selectedCount + ' 个物品',
        successCoins: selectedTotalValue,
      })

      this.loadData()
      this.loadBalance()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '出售失败')
    }
  },
})
