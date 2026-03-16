// pages/chat/chat.ts
import { getMessages, sendMessage, markMessagesAsRead } from '../../utils/api'
import { formatTime, showLoading, hideLoading, showToast } from '../../utils/util'

Page({
  data: {
    userId: '',
    username: '',
    messages: [] as any[],
    inputText: '',
    loading: true,
    sending: false
  },

  onLoad(options: any) {
    const { userId, username } = options
    
    if (!userId) {
      showToast('参数错误')
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    
    this.setData({ userId, username: decodeURIComponent(username || '用户') })
    wx.setNavigationBarTitle({ title: this.data.username })
    
    this.loadMessages()
  },

  onUnload() {
    // 标记消息已读
    if (this.data.userId) {
      markMessagesAsRead(this.data.userId).catch(() => {})
    }
  },

  async loadMessages() {
    this.setData({ loading: true })
    
    try {
      const messages = await getMessages(this.data.userId)
      this.setData({
        messages: messages || [],
        loading: false
      })
      
      // 滚动到底部
      setTimeout(() => {
        wx.pageScrollTo({ scrollTop: 999999 })
      }, 100)
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
      
      this.setData({
        messages: [...this.data.messages, newMessage],
        sending: false
      })
      
      // 滚动到底部
      setTimeout(() => {
        wx.pageScrollTo({ scrollTop: 999999 })
      }, 100)
    } catch (err: any) {
      showToast(err.message || '发送失败')
      this.setData({ sending: false })
    }
  },

  formatTime(dateStr: string): string {
    return formatTime(dateStr)
  }
})
