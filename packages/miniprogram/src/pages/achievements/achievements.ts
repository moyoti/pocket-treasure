// pages/achievements/achievements.ts
import { getUserAchievements, claimAchievementReward } from '../../utils/api'
import { showLoading, hideLoading, showToast } from '../../utils/util'

const TIER_COLORS: Record<string, string> = {
  bronze: '#92400E',
  silver: '#1E40AF',
  gold: '#B45309',
  platinum: '#7C3AED',
}

const TIER_GRADIENTS: Record<string, string> = {
  bronze: 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)',
  silver: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)',
  gold: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
  platinum: 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 100%)',
}

const TYPE_LABELS: Record<string, string> = {
  collection: '收集',
  rarity: '稀有度',
  distance: '距离',
  streak: '连续',
  special: '特殊',
}

Page({
  data: {
    achievements: [] as any[],
    loading: true,
    claimingId: '',
    // Stats
    completedCount: 0,
    totalCount: 0,
    canClaimCount: 0,
    progressPercent: 0,
    // Success toast
    showSuccess: false,
    successRewardCoins: 0,
    successRewardExp: 0,
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const rawAchievements = await getUserAchievements()
      const achievements = (rawAchievements || []).map((a: any) => {
        const achievement = a.achievement || {}
        const tier = achievement.tier || 'bronze'
        const type = achievement.type || 'collection'
        const progress = a.progress || 0
        const requirement = a.requirement || 1
        const progressPct = requirement > 0 ? Math.min(100, Math.round((progress / requirement) * 100)) : 0

        const rewards = achievement.rewards || {}
        const rewardCoins = rewards.coins || 0
        const rewardExp = rewards.experience || 0
        const rewardTitle = rewards.title || ''

        return {
          ...a,
          achievementName: achievement.name || '未知成就',
          achievementDesc: achievement.description || '',
          achievementIcon: achievement.icon || '/images/icons/trophy.svg',
          tierGradient: TIER_GRADIENTS[tier] || TIER_GRADIENTS.bronze,
          tierColor: TIER_COLORS[tier] || TIER_COLORS.bronze,
          typeLabel: TYPE_LABELS[type] || type,
          progressPct,
          progressText: progress + ' / ' + requirement,
          rewardCoins,
          rewardExp,
          rewardTitle,
          canClaim: a.canClaim || false,
          isClaimed: a.status === 'claimed',
          isClaimable: a.canClaim && a.status !== 'claimed',
        }
      })

      const completedCount = achievements.filter((a: any) => a.isClaimed).length
      const canClaimCount = achievements.filter((a: any) => a.canClaim).length
      const totalCount = achievements.length
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

      this.setData({
        achievements,
        completedCount,
        totalCount,
        canClaimCount,
        progressPercent,
        loading: false,
      })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async handleClaim(e: any) {
    const achievementId = e.currentTarget.dataset.id

    this.setData({ claimingId: achievementId })
    showLoading('领取中...')

    try {
      const res = await claimAchievementReward(achievementId)
      hideLoading()

      const rewards = res.rewards || {}
      this.setData({
        showSuccess: true,
        successRewardCoins: rewards.coins || 0,
        successRewardExp: rewards.experience || 0,
      })

      // Auto hide
      setTimeout(() => {
        this.setData({ showSuccess: false })
      }, 3000)

      this.loadData()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '领取失败')
    } finally {
      this.setData({ claimingId: '' })
    }
  },
})
