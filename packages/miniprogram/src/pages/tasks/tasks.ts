// pages/tasks/tasks.ts
import { getDailyTasks, claimTaskReward } from '../../utils/api'
import { showLoading, hideLoading, showToast } from '../../utils/util'

Page({
  data: {
    tasks: [] as any[],
    stats: null as any,
    loading: true,
    claimingId: '',
    // Stats display
    todayCompleted: 0,
    todayTotal: 0,
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
      const res = await getDailyTasks()
      const rawTasks = res.tasks || []
      const stats = res.stats || null

      const tasks = rawTasks.map((t: any) => {
        const progress = t.progress || 0
        const requirement = t.requirement || 1
        const progressPct = requirement > 0 ? Math.min(100, Math.round((progress / requirement) * 100)) : 0
        const rewards = t.rewards || {}

        let statusText = '进行中'
        let statusClass = 'status-progress'
        if (t.status === 'completed') {
          statusText = '已完成'
          statusClass = 'status-completed'
        } else if (t.status === 'claimed') {
          statusText = '已领取'
          statusClass = 'status-claimed'
        }

        return {
          ...t,
          progressPct,
          progressText: progress + ' / ' + requirement,
          rewardCoins: rewards.coins || 10,
          rewardExp: rewards.experience || 5,
          statusText,
          statusClass,
          canClaim: t.status === 'completed',
          isClaimed: t.status === 'claimed',
          isInProgress: t.status === 'in_progress' || (!t.status || t.status === 'pending'),
        }
      })

      const todayCompleted = stats ? (stats.todayCompleted || 0) : tasks.filter((t: any) => t.isClaimed || t.canClaim).length
      const todayTotal = stats ? (stats.todayTotal || 0) : tasks.length
      const progressPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0

      this.setData({
        tasks,
        stats,
        todayCompleted,
        todayTotal,
        progressPercent,
        loading: false,
      })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async handleClaim(e: any) {
    const taskId = e.currentTarget.dataset.id

    this.setData({ claimingId: taskId })
    showLoading('领取中...')

    try {
      const res = await claimTaskReward(taskId)
      hideLoading()

      const rewards = res.rewards || {}
      this.setData({
        showSuccess: true,
        successRewardCoins: rewards.coins || 0,
        successRewardExp: rewards.experience || 0,
      })

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
