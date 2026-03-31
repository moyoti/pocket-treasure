// pages/friends/friends.ts
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, searchUsers, getCoinBalance } from '../../utils/api'
import { showLoading, hideLoading, showToast, checkLogin } from '../../utils/util'

interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  isOnline?: boolean
}

interface Friend {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  avatarLetter?: string
}

interface FriendRequest {
  id: string
  requesterId: string
  requester: User
  requesterAvatarLetter?: string
}

interface SearchResultUser extends User {
  avatarLetter?: string
  hasPendingRequest?: boolean
}

interface PageData {
  friends: Friend[]
  onlineFriends: Friend[]
  offlineFriends: Friend[]
  requests: FriendRequest[]
  trades: never[]
  loading: boolean
  searchQuery: string
  searchResults: SearchResultUser[]
  searching: boolean
  activeTab: string
  expandedTradeIds: Record<string, boolean>
  balance: number
  isLoggedIn: boolean
}

Page({
  data: {
    friends: [] as Friend[],
    onlineFriends: [] as Friend[],
    offlineFriends: [] as Friend[],
    requests: [] as FriendRequest[],
    trades: [] as never[],
    loading: true,
    searchQuery: '',
    searchResults: [] as SearchResultUser[],
    searching: false,
    activeTab: 'friends',
    expandedTradeIds: {} as Record<string, boolean>,
    balance: 0,
    isLoggedIn: false
  } as PageData,

  onLoad() {
    this.setData({ isLoggedIn: checkLogin() })
    this.loadData()
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() })
    if (this.data.friends.length === 0 && !this.data.loading) {
      this.loadData()
    }
    if (checkLogin()) {
      this.loadBalance()
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

      const addAvatarLetter = (list: User[]) => (list || []).map((item: User) => ({
        ...item,
        avatarLetter: (item.username && item.username.length > 0) ? item.username[0].toUpperCase() : '?',
      })) as Friend[]
      const addRequesterLetter = (list: FriendRequest[]) => (list || []).map((item: FriendRequest) => ({
        ...item,
        requesterAvatarLetter: (item.requester && item.requester.username && item.requester.username.length > 0) ? item.requester.username[0].toUpperCase() : '?',
      }))

      const processedFriends = addAvatarLetter(friends)
      const onlineFriends = processedFriends.filter((f: Friend) => f.isOnline)
      const offlineFriends = processedFriends.filter((f: Friend) => !f.isOnline)

      this.setData({
        friends: processedFriends,
        onlineFriends,
        offlineFriends,
        requests: addRequesterLetter(requests),
        loading: false
      })
    } catch (err) {
      showToast((err as Error).message || '加载失败')
      this.setData({ loading: false })
    }
  },

  switchTab(e: { currentTarget: { dataset: { tab: string } } }) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  onSearchInput(e: { detail: { value: string } }) {
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
      const results = (await searchUsers(searchQuery.trim()) || []).map((item: User) => ({
        ...item,
        avatarLetter: (item.username && item.username.length > 0) ? item.username[0].toUpperCase() : '?',
      })) as SearchResultUser[]
      this.setData({ searchResults: results })
    } catch (err) {
      showToast((err as Error).message || '搜索失败')
    } finally {
      this.setData({ searching: false })
    }
  },

  async handleSendRequest(e: { currentTarget: { dataset: { id: string } } }) {
    const userId = e.currentTarget.dataset.id

    showLoading('发送中...')

    try {
      await sendFriendRequest(userId)
      hideLoading()
      showToast('申请已发送', 'success')

      this.setData({
        searchResults: this.data.searchResults.map((r: SearchResultUser) =>
          r.id === userId ? { ...r, hasPendingRequest: true } : r
        )
      })
    } catch (err) {
      hideLoading()
      showToast((err as Error).message || '发送失败')
    }
  },

  async handleAccept(e: { currentTarget: { dataset: { id: string } } }) {
    const requestId = e.currentTarget.dataset.id

    showLoading('处理中...')

    try {
      await acceptFriendRequest(requestId)
      hideLoading()
      showToast('已接受', 'success')
      this.loadData()
    } catch (err) {
      hideLoading()
      showToast((err as Error).message || '操作失败')
    }
  },

  async handleReject(e: { currentTarget: { dataset: { id: string } } }) {
    const requestId = e.currentTarget.dataset.id

    showLoading('处理中...')

    try {
      await rejectFriendRequest(requestId)
      hideLoading()
      showToast('已拒绝', 'success')
      this.loadData()
    } catch (err) {
      hideLoading()
      showToast((err as Error).message || '操作失败')
    }
  },

  startChat(e: { currentTarget: { dataset: { friend: Friend } } }) {
    const friend = e.currentTarget.dataset.friend
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${friend.id}&username=${encodeURIComponent(friend.username)}`
    })
  },

  startTrade() {
    showToast('交易功能即将上线')
  },

  toggleTradeExpand(e: { currentTarget: { dataset: { id: string } } }) {
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
