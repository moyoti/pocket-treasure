import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';

// 产品ID占位符 (等申请好Google/Apple账号后配置)
export const PRODUCT_IDS = {
  // 一次性商品
  GEM_PACK_SMALL: Platform.select({
    ios: 'com.treasurehunt.gems.small',
    android: 'gem_pack_small',
  }),
  GEM_PACK_MEDIUM: Platform.select({
    ios: 'com.treasurehunt.gems.medium',
    android: 'gem_pack_medium',
  }),
  GEM_PACK_LARGE: Platform.select({
    ios: 'com.treasurehunt.gems.large',
    android: 'gem_pack_large',
  }),
  GEM_PACK_HUGE: Platform.select({
    ios: 'com.treasurehunt.gems.huge',
    android: 'gem_pack_huge',
  }),
  // 订阅
  WEEKLY_GEMS: Platform.select({
    ios: 'com.treasurehunt.sub.weekly',
    android: 'sub_weekly_gems',
  }),
  MONTHLY_GEMS: Platform.select({
    ios: 'com.treasurehunt.sub.monthly',
    android: 'sub_monthly_gems',
  }),
};

let iapInitialized = false;

// 初始化 IAP
export async function initIAP(): Promise<boolean> {
  if (iapInitialized) return true;

  try {
    const result = await RNIap.initConnection();
    iapInitialized = result;
    return result;
  } catch (error) {
    console.error('IAP init failed:', error);
    return false;
  }
}

// 查询可购买产品
export async function getProducts(): Promise<RNIap.Product[]> {
  const productIds = Object.values(PRODUCT_IDS).filter(Boolean) as string[];
  try {
    return await RNIap.getProducts({ skus: productIds });
  } catch (error) {
    console.error('getProducts failed:', error);
    return [];
  }
}

// 发起购买
export async function purchaseProduct(productId: string): Promise<RNIap.Purchase | null> {
  try {
    // Android会自动弹出Google Play购买界面
    // iOS会自动弹出App Store购买界面
    const purchase = await RNIap.requestPurchase({ sku: productId });
    return purchase?.[0] || null;
  } catch (error) {
    if (error instanceof RNIap.PurchaseError) {
      // 用户取消或其他错误
      console.log('Purchase error:', error.code, error.message);
    }
    return null;
  }
}

// 订阅产品
export async function subscribeToProduct(productId: string): Promise<RNIap.Purchase | null> {
  try {
    const purchase = await RNIap.requestSubscription({ sku: productId });
    return purchase?.[0] || null;
  } catch (error) {
    if (error instanceof RNIap.PurchaseError) {
      console.log('Subscription error:', error.code, error.message);
    }
    return null;
  }
}

// 结束交易 (必须调用以完成购买流程)
export async function finishTransaction(purchase: RNIap.Purchase): Promise<boolean> {
  try {
    await RNIap.finishTransaction({ purchase });
    return true;
  } catch (error) {
    console.error('finishTransaction failed:', error);
    return false;
  }
}

// 获取未结束的交易 (用于恢复购买)
export async function getPendingPurchases(): Promise<RNIap.Purchase[]> {
  try {
    return await RNIap.getAvailablePurchases();
  } catch (error) {
    console.error('getAvailablePurchases failed:', error);
    return [];
  }
}