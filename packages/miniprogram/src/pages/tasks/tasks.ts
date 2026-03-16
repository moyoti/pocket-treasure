// pages/tasks/tasks.ts
import { getDailyTasks, claimTaskReward } from '../../utils/api'
import { showLoading, hideLoading, showToast } from '../../utils/util'

Page({
  data: {
    tasks: [] as any[],
    stats: null as any,
    loading: true
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
      const res = await getDailyTasks()
      this.setData({
        tasks: res.tasks || [],
        stats: res.stats || null,
        loading: false
      })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  async handleClaim(e: any) {
    const taskId = e.currentTarget.dataset.id
    
    showLoading('领取中...')
    
    try {
      const res = await claimTaskReward(taskId)
      hideLoading()
      
      wx.showModal({
        title: '🎉 领取成功！',
        content: `金币 +${res.rewards?.coins || 0}\n经验 +${res.rewards?.experience || 0}`,
        showCancel: false
      })
      
      this.loadData()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '领取失败')
    }
  },

  getTaskStatusText(status: string): string {
    switch (status) {
      case 'in_progress': return '进行中'
      case 'completed': return '已完成'
      case 'claimed': return '已领取'
      default: return status
    }
  },

  getTaskStatusClass(status: string): string {
    switch (status) {
      case 'in_progress': return 'status-progress'
      case 'completed': return 'status-completed'
      case 'claimed': return 'status-claimed'
      default: return ''
    }
  }
})
