// pages/market/market.ts
import { getMarketListings, getInventory, createMarketListing, buyMarketListing, getCoinBalance } from '../../utils/api';

Page({
  data: {
    listings: [] as any[],
    myItems: [] as any[],
    balance: 0,
    loading: true,
    activeTab: 'buy',
    sellModal: {
      isOpen: false,
      item: null as any,
      price: 100,
      quantity: 1
    }
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    try {
      const [listings, inventory, balance] = await Promise.all([
        getMarketListings(),
        getInventory(),
        getCoinBalance()
      ]);

      this.setData({
        listings: listings || [],
        myItems: inventory || [],
        balance: balance.balance,
        loading: false
      });
    } catch (error) {
      console.error('加载市场数据失败:', error);
      this.setData({ loading: false });
    }
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  openSellModal(e: any) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      sellModal: {
        isOpen: true,
        item,
        price: 100,
        quantity: 1
      }
    });
  },

  closeSellModal() {
    this.setData({
      sellModal: { isOpen: false, item: null, price: 100, quantity: 1 }
    });
  },

  onPriceInput(e: any) {
    this.setData({ 'sellModal.price': parseInt(e.detail.value) || 0 });
  },

  async confirmSell() {
    const { sellModal } = this.data;
    if (!sellModal.item) return;

    try {
      wx.showLoading({ title: '上架中...' });

      await createMarketListing(sellModal.item.id, sellModal.quantity, sellModal.price);

      wx.hideLoading();
      wx.showToast({ title: '上架成功！', icon: 'success' });

      this.closeSellModal();
      this.loadData();
    } catch (error) {
      wx.hideLoading();
      console.error('上架失败:', error);
    }
  },

  async buyItem(e: any) {
    const listing = e.currentTarget.dataset.item;

    try {
      const result = await wx.showModal({
        title: '确认购买',
        content: `确定以 ${listing.price} 金币购买 ${listing.item.name}？`
      });

      if (result.confirm) {
        wx.showLoading({ title: '购买中...' });
        await buyMarketListing(listing.id);
        wx.hideLoading();
        wx.showToast({ title: '购买成功！', icon: 'success' });
        this.loadData();
      }
    } catch (error) {
      wx.hideLoading();
      console.error('购买失败:', error);
    }
  },

  goBack() {
    wx.navigateBack();
  }
});