// pages/leaderboard/leaderboard.ts
import { getLeaderboard, getMyLeaderboardRank, getCoinBalance } from '../../utils/api';
import { showToast, checkLogin } from '../../utils/util';

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
    currentUserId: '',
    balance: 0,
    isLoggedIn: false
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
    this.setData({ isLoggedIn: checkLogin() });
    this.loadData();
    if (checkLogin()) {
      this.loadBalance();
    }
  },

  onShow() {
    this.setData({ isLoggedIn: checkLogin() });
    if (checkLogin()) {
      this.loadBalance();
    }
  },

  async loadBalance() {
    try {
      const res = await getCoinBalance();
      this.setData({ balance: res.balance || 0 });
    } catch (err) {
      console.error('获取余额失败:', err);
    }
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
      showToast('加载排行榜失败');
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
