// pages/chat/chat.ts
import { getConversations, getMessages, sendMessage, markMessagesAsRead, getFriends } from '../../utils/api'
import { formatTime, showToast, getUserInfo } from '../../utils/util'

Page({
  data: {
    // Mode: 'list' (conversation list) or 'chat' (chat with user)
    mode: 'list' as 'list' | 'chat',
    // Conversation list data
    conversations: [] as any[],
    friends: [] as any[],
    // Chat data
    userId: '',
    username: '',
    messages: [] as any[],
    inputText: '',
    loading: true,
    sending: false,
    scrollToMessage: '',
    currentUserId: ''
  },

  onLoad(options: any) {
    const { userId, username } = options || {}

    // Get current user ID from storage
    const userInfo = getUserInfo()
    const currentUserId = userInfo ? (userInfo.id || '') : ''

    if (userId) {
      // Chat mode - open specific conversation
      this.setData({
        mode: 'chat',
        userId,
        username: decodeURIComponent(username || '用户'),
        currentUserId
      })
      wx.setNavigationBarTitle({ title: decodeURIComponent(username || '聊天') })
      this.loadMessages()
    } else {
      // List mode - show conversations
      this.setData({ mode: 'list', currentUserId })
      wx.setNavigationBarTitle({ title: '聊天' })
      this.loadConversations()
    }
  },

  onShow() {
    if (this.data.mode === 'list') {
      this.loadConversations()
    }
  },

  onUnload() {
    if (this.data.userId) {
      markMessagesAsRead(this.data.userId).catch(() => {})
    }
  },

  // === Conversation List Mode ===
  async loadConversations() {
    this.setData({ loading: true })

    try {
      const [conversations, friends] = await Promise.all([
        getConversations(),
        getFriends()
      ])

      const processedConversations = (conversations || []).map((conv: any) => ({
        ...conv,
        avatarLetter: conv.username ? conv.username[0].toUpperCase() : '?',
        lastMessagePreview: conv.lastMessage ? conv.lastMessage.content : '',
        lastMessageTime: conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : '',
      }))

      const processedFriends = (friends || []).map((f: any) => ({
        ...f,
        avatarLetter: f.username ? f.username[0].toUpperCase() : '?',
      }))

      this.setData({
        conversations: processedConversations,
        friends: processedFriends,
        loading: false
      })
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  openChat(e: any) {
    const { userid, username } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${userid}&username=${encodeURIComponent(username)}`
    })
  },

  openFriendChat(e: any) {
    const friend = e.currentTarget.dataset.friend
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${friend.id}&username=${encodeURIComponent(friend.username)}`
    })
  },

  // === Chat Mode ===
  async loadMessages() {
    this.setData({ loading: true })

    try {
      const messages = await getMessages(this.data.userId)
      const processed = (messages || []).map((msg: any, index: number) => ({
        ...msg,
        isOwn: msg.senderId === this.data.currentUserId,
        formattedTime: formatTime(msg.createdAt),
        msgId: 'msg-' + index,
      }))

      this.setData({
        messages: processed,
        loading: false
      })

      // Scroll to bottom
      if (processed.length > 0) {
        this.setData({
          scrollToMessage: 'msg-' + (processed.length - 1)
        })
      }

      // Mark as read
      markMessagesAsRead(this.data.userId).catch(() => {})
    } catch (err: any) {
      showToast(err.message || '加载失败')
      this.setData({ loading: false })
    }
  },

  onInputChange(e: any) {
    this.setData({ inputText: e.detail.value })
  },

  async handleSend() {
    const { inputText, userId, sending } = this.data

    if (!inputText.trim() || sending) return

    const content = inputText.trim()
    this.setData({ inputText: '', sending: true })

    try {
      const newMessage = await sendMessage(userId, content)

      const processed = {
        ...newMessage,
        isOwn: true,
        formattedTime: formatTime(newMessage.createdAt || new Date().toISOString()),
        msgId: 'msg-' + this.data.messages.length,
      }

      const messages = [...this.data.messages, processed]
      this.setData({
        messages,
        sending: false,
        scrollToMessage: processed.msgId
      })
    } catch (err: any) {
      showToast(err.message || '发送失败')
      this.setData({ inputText: content, sending: false })
    }
  }
})
