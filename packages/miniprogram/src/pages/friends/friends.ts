// pages/friends/friends.ts
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, searchUsers } from '../../utils/api'
import { showLoading, hideLoading, showToast } from '../../utils/util'

Page({
  data: {
    friends: [] as any[],
    requests: [] as any[],
    loading: true,
    searchQuery: '',
    searchResults: [] as any[],
    searching: false,
    activeTab: 'friends'
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
      const [friends, requests] = await Promise.all([
        getFriends(),
        getFriendRequests()
      ])
      
      this.setData({
        friends: friends || [],
        requests: requests || [],
        loading: false
      })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  onSearchInput(e: any) {
    this.setData({ searchQuery: e.detail.value })
  },

  async handleSearch() {
    const { searchQuery } = this.data
    if (!searchQuery.trim()) return
    
    this.setData({ searching: true })
    
    try {
      const results = await searchUsers(searchQuery.trim())
      this.setData({ searchResults: results || [] })
    } catch (err: any) {
      showToast(err.message || '搜索失败')
    } finally {
      this.setData({ searching: false })
    }
  },

  async handleSendRequest(e: any) {
    const userId = e.currentTarget.dataset.id
    
    showLoading('发送中...')
    
    try {
      await sendFriendRequest(userId)
      hideLoading()
      showToast('申请已发送', 'success')
      
      // 更新搜索结果
      this.setData({
        searchResults: this.data.searchResults.map((r: any) =>
          r.id === userId ? { ...r, hasPendingRequest: true } : r
        )
      })
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '发送失败')
    }
  },

  async handleAccept(e: any) {
    const requestId = e.currentTarget.dataset.id
    
    showLoading('处理中...')
    
    try {
      await acceptFriendRequest(requestId)
      hideLoading()
      showToast('已接受', 'success')
      this.loadData()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '操作失败')
    }
  },

  async handleReject(e: any) {
    const requestId = e.currentTarget.dataset.id
    
    showLoading('处理中...')
    
    try {
      await rejectFriendRequest(requestId)
      hideLoading()
      showToast('已拒绝', 'success')
      this.loadData()
    } catch (err: any) {
      hideLoading()
      showToast(err.message || '操作失败')
    }
  },

  startChat(e: any) {
    const friend = e.currentTarget.dataset.friend
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${friend.id}&username=${friend.username}`
    })
  }
})
