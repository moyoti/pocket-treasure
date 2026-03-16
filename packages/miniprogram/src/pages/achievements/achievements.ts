// pages/achievements/achievements.ts
import { getUserAchievements, claimAchievementReward } from '../../utils/api'
import { showLoading, hideLoading, showToast } from '../../utils/util'

Page({
  data: {
    achievements: [] as any[],
    loading: true,
    claiming: false
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      const achievements = await getUserAchievements()
      this.setData({ achievements: achievements || [], loading: false })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async handleClaim(e: any) {
    const achievementId = e.currentTarget.dataset.id
    
    this.setData({ claiming: true })
    showLoading('领取中...')
    
    try {
      await claimAchievementReward(achievementId)
      hideLoading()
      showToast('领取成功！', 'success')
      this.loadData()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '领取失败')
    } finally {
      this.setData({ claiming: false })
    }
  }
})
