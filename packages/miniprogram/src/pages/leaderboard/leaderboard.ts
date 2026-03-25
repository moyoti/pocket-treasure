// pages/leaderboard/leaderboard.ts
import { getLeaderboard, getMyLeaderboardRank } from '../../utils/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  collectionCount: number;
  avatarLetter: string;
}

Page({
  data: {
    leaderboard: [] as LeaderboardEntry[],
    top3: [] as LeaderboardEntry[],
    rest: [] as LeaderboardEntry[],
    myRank: null as number | null,
    myUsername: '',
    myAvatarLetter: '',
    loading: true,
    currentUserId: ''
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      const username = userInfo.username || '';
      this.setData({
        currentUserId: userInfo.id || '',
        myUsername: username,
        myAvatarLetter: username.charAt(0).toUpperCase() || '?'
      });
    }
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      const [leaderboard, myRankRes] = await Promise.all([
        getLeaderboard(),
        getMyLeaderboardRank().catch(() => null)
      ]);

      const entries: LeaderboardEntry[] = (leaderboard || []).map((item: any, index: number) => ({
        rank: item.rank || index + 1,
        userId: item.userId || item.id || '',
        username: item.username || '',
        avatar: item.avatar || null,
        collectionCount: item.collectionCount || 0,
        avatarLetter: (item.username || '?').charAt(0).toUpperCase()
      }));

      const myRank = myRankRes?.rank || null;
      const top3 = entries.slice(0, 3);
      const rest = entries.slice(3);

      this.setData({
        leaderboard: entries,
        top3,
        rest,
        myRank,
        loading: false
      });
    } catch (error) {
      console.error('加载排行榜失败:', error);
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  goToMap() {
    wx.switchTab({ url: '/pages/map/map' });
  }
});
