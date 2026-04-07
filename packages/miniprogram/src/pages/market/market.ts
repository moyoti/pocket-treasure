// pages/market/market.ts
import { getMarketListings, getInventory, getMyListings, createMarketListing, buyMarketListing, cancelMarketListing, getCoinBalance, getRecentSales, getPriceHistory } from '../../utils/api'
import { showLoading, hideLoading, showToast, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'

const MARKET_FEE_RATE = 0.1

interface ItemInfo {
  id: string
  name: string
  rarity: string
  price?: number
}

interface Seller {
  id: string
  username: string
}

interface MarketListing {
  id: string
  item: ItemInfo
  quantity: number
  price: number
  seller: Seller
  createdAt?: string
}

interface EnrichedListing extends MarketListing {
  rarityName: string
  rarityColor: string
  rarityBgClass: string
  sellerName: string
  itemName: string
  priceText: string
}

interface InventoryItem {
  id: string
  item: ItemInfo
  quantity: number
}

interface EnrichedInventoryItem extends InventoryItem {
  rarityName: string
  rarityColor: string
  rarityBgClass: string
}

interface EnrichedSale {
  id: string
  itemName: string
  rarityName: string
  rarityColor: string
  rarityBgClass: string
  priceText: string
  price: number
  timeAgo: string
  soldAt: string
}

Page({
  data: {
    listings: [] as EnrichedListing[],
    filteredListings: [] as EnrichedListing[],
    myItems: [] as EnrichedInventoryItem[],
    myListings: [] as MarketListing[],
    balance: 0,
    loading: true,
    activeTab: 'buy' as 'buy' | 'sell',
    isLoggedIn: false,
    // Search & filter
    searchQuery: '',
    rarityFilter: '',
    sortBy: 'time_desc',
    showFilters: false,
    // Recent sales
    recentSales: [] as EnrichedSale[],
    // Buy modal
    buyModalOpen: false,
    buyListing: null as EnrichedListing | null,
    buyLoading: false,
    // Sell modal
    sellModalOpen: false,
    sellItemData: null as EnrichedInventoryItem | null,
    sellQty: 1,
    sellMaxQty: 1,
    sellPrice: 100,
    sellTotalPrice: 100,
    sellFee: 10,
    sellNetIncome: 90,
    sellLoading: false,
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
      const [listingsRes, inventory, balanceRes, recentSalesRes] = await Promise.all([
        getMarketListings(),
        checkLogin() ? getInventory() : Promise.resolve([]),
        checkLogin() ? getCoinBalance() : Promise.resolve({ balance: 0 }),
        getRecentSales(20).catch(() => ({ sales: [] })),
      ])

      const rawListings = listingsRes.listings || listingsRes || []
      const listings = rawListings.map((l: MarketListing) => {
        const rarity = (l.item && l.item.rarity) ? l.item.rarity : 'common'
        return {
          ...l,
          rarityName: RARITY_NAMES[rarity] || '普通',
          rarityColor: RARITY_COLORS[rarity] || '#6B7280',
          rarityBgClass: 'rarity-bg-' + rarity,
          sellerName: (l.seller && l.seller.username) ? l.seller.username : '未知',
          itemName: (l.item && l.item.name) ? l.item.name : '未知物品',
          priceText: l.price ? String(l.price) : '0',
        }
      })

      const myItems = (inventory || []).filter((i: InventoryItem) => i.quantity > 0).map((item: InventoryItem) => {
        const rarity = (item.item && item.item.rarity) ? item.item.rarity : 'common'
        return {
          ...item,
          rarityName: RARITY_NAMES[rarity] || '普通',
          rarityColor: RARITY_COLORS[rarity] || '#6B7280',
          rarityBgClass: 'rarity-bg-' + rarity,
        }
      })

      let myListings: MarketListing[] = []
      if (checkLogin()) {
        try {
          const myListingsRes = await getMyListings()
          myListings = myListingsRes || []
        } catch (err) {
          console.error('获取我的上架失败:', err)
        }
      }

      const rawSales = recentSalesRes.sales || recentSalesRes || []
      const recentSales = rawSales.map((s: any) => {
        const rarity = (s.item && s.item.rarity) ? s.item.rarity : 'common'
        return {
          ...s,
          rarityName: RARITY_NAMES[rarity] || '普通',
          rarityColor: RARITY_COLORS[rarity] || '#6B7280',
          rarityBgClass: 'rarity-bg-' + rarity,
          itemName: (s.item && s.item.name) ? s.item.name : '未知物品',
          priceText: s.price ? String(s.price) : '0',
          timeAgo: this.formatTimeAgo(s.soldAt),
        }
      })

      this.setData({
        listings,
        filteredListings: listings,
        myItems,
        myListings,
        balance: balanceRes.balance || 0,
        recentSales,
        loading: false,
      })
    } catch (error) {
      console.error('加载市场数据失败:', error)
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

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // Search
  onSearchInput(e: any) {
    const query = e.detail.value || ''
    this.setData({ searchQuery: query })
    this.applyFilters()
  },

  toggleFilters() {
    this.setData({ showFilters: !this.data.showFilters })
  },

  setRarityFilter(e: any) {
    const rarity = e.currentTarget.dataset.rarity || ''
    this.setData({ rarityFilter: rarity })
    this.applyFilters()
  },

  setSortBy(e: any) {
    const sortBy = e.currentTarget.dataset.sort || 'time_desc'
    this.setData({ sortBy })
    this.applyFilters()
  },

  applyFilters() {
    const { listings, searchQuery, rarityFilter, sortBy } = this.data
    const query = searchQuery.toLowerCase()
    let filtered = listings.filter((l: EnrichedListing) => {
      const matchesSearch = !query || (l.itemName && l.itemName.toLowerCase().indexOf(query) >= 0)
      const matchesRarity = !rarityFilter || (l.item && l.item.rarity === rarityFilter)
      return matchesSearch && matchesRarity
    })
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price_desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'time_desc':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case 'time_asc':
        filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
        break
    }
    this.setData({ filteredListings: filtered })
  },

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  },

  // Buy
  openBuyModal(e: any) {
    if (!checkLogin()) {
      this.goToLogin()
      return
    }
    const index = e.currentTarget.dataset.index
    const listing = this.data.filteredListings[index]
    if (!listing) return

    this.setData({
      buyModalOpen: true,
      buyListing: listing,
      buyLoading: false,
    })
  },

  closeBuyModal() {
    this.setData({ buyModalOpen: false, buyListing: null })
  },

  async confirmBuy() {
    const { buyListing } = this.data
    if (!buyListing) return

    this.setData({ buyLoading: true })

    try {
      await buyMarketListing(buyListing.id)

      this.setData({
        buyModalOpen: false,
        buyListing: null,
        buyLoading: false,
        successModalOpen: true,
        successMessage: '成功购买 ' + buyListing.itemName,
      })

      this.loadData()
    } catch (err: any) {
      this.setData({ buyLoading: false })
      showToast(err.message || '购买失败')
    }
  },

  // Sell
  openSellModal(e: any) {
    if (!checkLogin()) {
      this.goToLogin()
      return
    }
    const index = e.currentTarget.dataset.index
    const item = this.data.myItems[index]
    if (!item) return

    const price = item.item?.price || item.price || 0
    const qty = 1
    const total = price * qty
    const fee = Math.floor(total * MARKET_FEE_RATE)
    const net = total - fee

    this.setData({
      sellModalOpen: true,
      sellItemData: item,
      sellQty: qty,
      sellMaxQty: item.quantity,
      sellPrice: price,
      sellTotalPrice: total,
      sellFee: fee,
      sellNetIncome: net,
      sellLoading: false,
    })
  },

  closeSellModal() {
    this.setData({ sellModalOpen: false, sellItemData: null })
  },

  decreaseSellQty() {
    const qty = Math.max(1, this.data.sellQty - 1)
    this.updateSellCalc(qty, this.data.sellPrice)
  },

  increaseSellQty() {
    const qty = Math.min(this.data.sellMaxQty, this.data.sellQty + 1)
    this.updateSellCalc(qty, this.data.sellPrice)
  },

  onSellPriceInput(e: any) {
    const price = parseInt(e.detail.value) || 0
    this.updateSellCalc(this.data.sellQty, price)
  },

  updateSellCalc(qty: number, price: number) {
    const total = price * qty
    const fee = Math.floor(total * MARKET_FEE_RATE)
    const net = total - fee
    this.setData({
      sellQty: qty,
      sellPrice: price,
      sellTotalPrice: total,
      sellFee: fee,
      sellNetIncome: net,
    })
  },

  async confirmSell() {
    const { sellItemData, sellQty, sellPrice } = this.data
    if (!sellItemData || sellPrice <= 0) return

    this.setData({ sellLoading: true })

    try {
      await createMarketListing(sellItemData.id, sellQty, sellPrice)

      const itemName = (sellItemData.item && sellItemData.item.name) ? sellItemData.item.name : '物品'

      this.setData({
        sellModalOpen: false,
        sellItemData: null,
        sellLoading: false,
        successModalOpen: true,
        successMessage: '成功上架 ' + itemName,
      })

      this.loadData()
    } catch (err: any) {
      this.setData({ sellLoading: false })
      showToast(err.message || '上架失败')
    }
  },

  // Cancel listing
  async cancelListing(e: any) {
    const listingId = e.currentTarget.dataset.id

    const result = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: '取消上架',
        content: '确定要取消这个上架吗？',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      })
    })
    if (!result) return

    showLoading('取消中...')
    try {
      await cancelMarketListing(listingId)
      hideLoading()
      showToast('取消成功', 'success')
      this.loadData()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '取消失败')
    }
  },

  closeSuccessModal() {
    this.setData({ successModalOpen: false })
  },
})
