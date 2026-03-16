// pages/leaderboard/leaderboard.ts
import { getLeaderboard } from '../../utils/api';

Page({
  data: {
    leaderboard: [] as any[],
    loading: true
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      const leaderboard = await getLeaderboard();
      this.setData({
        leaderboard: leaderboard || [],
        loading: false
      });
    } catch (error) {
      console.error('加载排行榜失败:', error);
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});