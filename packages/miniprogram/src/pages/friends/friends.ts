// pages/friends/friends.ts
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, searchUsers } from '../../utils/api'
import { showLoading, hideLoading, showToast } from '../../utils/util'

Page({
  data: {
    friends: [] as any[],
    onlineFriends: [] as any[],
    offlineFriends: [] as any[],
    requests: [] as any[],
    trades: [] as any[],
    loading: true,
    searchQuery: '',
    searchResults: [] as any[],
    searching: false,
    activeTab: 'friends',
    expandedTradeIds: {} as Record<string, boolean>
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
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

      const addAvatarLetter = (list: any[]) => (list || []).map((item: any) => ({
        ...item,
        avatarLetter: item.username ? item.username[0].toUpperCase() : '?',
      }))
      const addRequesterLetter = (list: any[]) => (list || []).map((item: any) => ({
        ...item,
        requesterAvatarLetter: item.requester && item.requester.username ? item.requester.username[0].toUpperCase() : '?',
      }))

      const processedFriends = addAvatarLetter(friends)
      const onlineFriends = processedFriends.filter((f: any) => f.isOnline)
      const offlineFriends = processedFriends.filter((f: any) => !f.isOnline)

      this.setData({
        friends: processedFriends,
        onlineFriends,
        offlineFriends,
        requests: addRequesterLetter(requests),
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
    if (!searchQuery.trim()) {
      this.setData({ searchResults: [] })
      return
    }

    this.setData({ searching: true })

    try {
      const results = (await searchUsers(searchQuery.trim()) || []).map((item: any) => ({
        ...item,
        avatarLetter: item.username ? item.username[0].toUpperCase() : '?',
      }))
      this.setData({ searchResults: results })
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
      url: `/pages/chat/chat?userId=${friend.id}&username=${encodeURIComponent(friend.username)}`
    })
  },

  startTrade() {
    showToast('交易功能即将上线')
  },

  toggleTradeExpand(e: any) {
    const tradeId = e.currentTarget.dataset.id
    const key = `expandedTradeIds.${tradeId}`
    this.setData({
      [key]: !this.data.expandedTradeIds[tradeId]
    })
  },

  async handleAcceptTrade() {
    showToast('交易功能即将上线')
  },

  async handleRejectTrade() {
    showToast('交易功能即将上线')
  }
})
