// pages/profile-stats/profile-stats.ts
import { getUserStats, getInventoryStats } from '../../utils/api'

Page({
  data: {
    loading: true,
    totalItems: 0,
    uniqueItems: 0,
    commonCount: 0,
    rareCount: 0,
    epicCount: 0,
    legendaryCount: 0,
    commonPct: 0,
    rarePct: 0,
    epicPct: 0,
    legendaryPct: 0,
    completedAchievements: 0,
    totalAchievements: 0,
    achievementPct: 0,
    daysSinceJoin: 0,
    dailyAverage: 0,
  },

  onLoad() {
    this.fetchStats()
  },

  async fetchStats() {
    try {
      const [statsRes, inventoryRes] = await Promise.all([
        getUserStats(),
        getInventoryStats()
      ])

      const collection = inventoryRes || {}
      const totalItems = collection.totalItems || 0
      const uniqueItems = collection.uniqueItems || 0
      const byRarity = collection.byRarity || {}

      const commonCount = byRarity.common || 0
      const rareCount = byRarity.rare || 0
      const epicCount = byRarity.epic || 0
      const legendaryCount = byRarity.legendary || 0

      const commonPct = totalItems > 0 ? Math.round((commonCount / totalItems) * 100) : 0
      const rarePct = totalItems > 0 ? Math.round((rareCount / totalItems) * 100) : 0
      const epicPct = totalItems > 0 ? Math.round((epicCount / totalItems) * 100) : 0
      const legendaryPct = totalItems > 0 ? Math.round((legendaryCount / totalItems) * 100) : 0

      const achievements = statsRes && statsRes.achievements ? statsRes.achievements : {}
      const completedAchievements = achievements.completed || 0
      const totalAchievements = achievements.total || 0
      const achievementPct = totalAchievements > 0
        ? Math.round((completedAchievements / totalAchievements) * 100)
        : 0

      const joinDate = statsRes && statsRes.joinDate ? statsRes.joinDate : new Date().toISOString()
      const daysSinceJoin = Math.max(1, Math.floor(
        (new Date().getTime() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24)
      ))
      const dailyAverage = Math.round((totalItems / daysSinceJoin) * 10) / 10

      this.setData({
        loading: false,
        totalItems,
        uniqueItems,
        commonCount,
        rareCount,
        epicCount,
        legendaryCount,
        commonPct,
        rarePct,
        epicPct,
        legendaryPct,
        completedAchievements,
        totalAchievements,
        achievementPct,
        daysSinceJoin,
        dailyAverage,
      })
    } catch (err) {
      console.error('加载统计失败:', err)
      this.setData({ loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
