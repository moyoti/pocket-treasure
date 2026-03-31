// pages/gacha/gacha.ts
import { getGachaPools, pullGacha, getCoinBalance } from '../../utils/api'
import { showToast, checkLogin, RARITY_NAMES, RARITY_COLORS } from '../../utils/util'

interface GachaItem {
  id: string
  name: string
  rarity: string
  weight: number
  image?: string
}

interface GachaPool {
  id: string
  name: string
  description?: string
  cost: number
  costTen?: number
  singlePrice?: number
  tenPrice?: number
  pityThreshold: number
  pityMinRarity: string
  items: GachaItem[]
}

interface GachaResult {
  id: string
  name: string
  rarity: string
  isPity: boolean
}

interface DropRate {
  rarity: string
  name: string
  color: string
  percentage: string
}

Page({
  data: {
    pools: [] as GachaPool[],
    selectedPool: null as GachaPool | null,
    balance: 0,
    loading: true,
    isPulling: false,
    pityCount: 0,
    pityThreshold: 90,
    pityProgress: 0,
    pityMinRarityName: '',
    isLoggedIn: false,
    // Drop rates
    dropRates: [] as DropRate[],
    // Single/ten prices
    singlePrice: 0,
    tenPrice: 0,
    canSingle: false,
    canTen: false,
    // Results modal
    showResults: false,
    results: [] as GachaResult[],
    // Pull animation
    showPullAnimation: false,
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
      const processedPools = (pools || []).map((p: GachaPool) => ({
        ...p,
        isSelected: false,
      }))

      if (processedPools.length > 0) {
        processedPools[0].isSelected = true
        this.setData({
          pools: processedPools,
          loading: false,
        })
        this.selectPoolData(processedPools[0])
      } else {
        this.setData({ pools: processedPools, loading: false })
      }
    } catch (err: { message?: string } | unknown) {
      const message = err instanceof Error ? err.message : '加载失败'
      showToast(message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async loadBalance() {
    try {
      const res = await getCoinBalance()
      this.setData({ balance: res.balance || 0 })
      this.updateAffordability()
    } catch (err) {
      console.error('获取余额失败:', err)
      showToast('获取余额失败')
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  selectPool(e: { currentTarget: { dataset: { id: string } } }) {
    const poolId = e.currentTarget.dataset.id
    const pools = this.data.pools.map((p: GachaPool) => ({
      ...p,
      isSelected: p.id === poolId,
    }))
    const pool = pools.find((p: GachaPool) => p.id === poolId)
    this.setData({ pools })
    if (pool) {
      this.selectPoolData(pool)
    }
  },

  selectPoolData(pool: GachaPool) {
    const pityThreshold = pool.pityThreshold || 90
    const pityMinRarity = pool.pityMinRarity || 'epic'
    const pityProgress = pityThreshold > 0 ? Math.min(100, Math.round((this.data.pityCount / pityThreshold) * 100)) : 0

    // Calculate drop rates
    const items = pool.items || []
    const totalWeight = items.reduce((sum: number, i: GachaItem) => sum + (i.weight || 0), 0)
    const rarities = ['legendary', 'epic', 'rare', 'common']
    const dropRates = rarities.map((rarity: string) => {
      const rarityItems = items.filter((i: GachaItem) => i.rarity === rarity)
      const weight = rarityItems.reduce((sum: number, i: GachaItem) => sum + (i.weight || 0), 0)
      const pct = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0'
      return {
        rarity,
        name: RARITY_NAMES[rarity] || rarity,
        color: RARITY_COLORS[rarity] || '#6B7280',
        percentage: pct,
      }
    })

    const singlePrice = pool.singlePrice || pool.cost || 100
    const tenPrice = pool.tenPrice || pool.costTen || 900

    this.setData({
      selectedPool: pool,
      pityThreshold,
      pityProgress,
      pityMinRarityName: RARITY_NAMES[pityMinRarity] || '史诗',
      dropRates,
      singlePrice,
      tenPrice,
    })

    this.updateAffordability()
  },

  updateAffordability() {
    const { balance, singlePrice, tenPrice } = this.data
    this.setData({
      canSingle: balance >= singlePrice,
      canTen: balance >= tenPrice,
    })
  },

  async handlePull(e: { currentTarget: { dataset: { type: 'single' | 'ten' } } }) {
    if (!checkLogin()) {
      this.goToLogin()
      return
    }

    const pullType = e.currentTarget.dataset.type
    const { selectedPool, balance, singlePrice, tenPrice } = this.data

    if (!selectedPool) {
      showToast('请选择抽奖池')
      return
    }

    const cost = pullType === 'ten' ? tenPrice : singlePrice
    if (balance < cost) {
      showToast('金币不足')
      return
    }

    this.setData({ isPulling: true, showPullAnimation: true })

    try {
      const res = await pullGacha(selectedPool.id, pullType)

      // Update balance
      const newBalance = res.newCoinBalance !== undefined ? res.newCoinBalance : (balance - cost)
      const newPity = res.newPityCount || 0

      // Process results
      const results = (res.results || res.items || []).map((r: { id?: string; name?: string; rarity?: string; isPity?: boolean; item?: { id?: string; name?: string; rarity?: string } }) => {
        const rarity = r.rarity || (r.item && r.item.rarity) || 'common'
        return {
          id: r.id || (r.item && r.item.id) || '',
          name: r.name || (r.item && r.item.name) || '未知物品',
          rarity: rarity,
          rarityName: RARITY_NAMES[rarity] || rarity,
          rarityColor: RARITY_COLORS[rarity] || '#6B7280',
          isPity: r.isPity || false,
        }
      })

      // Delay to show animation
      setTimeout(() => {
        const pityProgress = this.data.pityThreshold > 0
          ? Math.min(100, Math.round((newPity / this.data.pityThreshold) * 100))
          : 0

        this.setData({
          isPulling: false,
          showPullAnimation: false,
          balance: newBalance,
          pityCount: newPity,
          pityProgress,
          results,
          showResults: true,
        })
        this.updateAffordability()
      }, 1500)
    } catch (err: { message?: string } | unknown) {
      this.setData({ isPulling: false, showPullAnimation: false })
      const message = err instanceof Error ? err.message : '抽奖失败'
      showToast(message || '抽奖失败')
      this.loadBalance()
    }
  },

  closeResults() {
    this.setData({ showResults: false, results: [] })
  },
})
