import * as RNIap from 'react-native-iap';
import { Purchase } from './iap';

// 存储更新回调
type TransactionUpdateCallback = (purchase: Purchase) => Promise<void>;

let updateCallback: TransactionUpdateCallback | null = null;
let unsubscribe: (() => void) | null = null;

// 设置交易更新监听
// 当有新交易或交易更新时调用 (订阅续订、退款等)
export function setupTransactionListener(
  callback: TransactionUpdateCallback
): () => void {
  updateCallback = callback;

  // react-native-iap 会自动处理 Transaction.updates
  // 我们这里设置自己的轮询/回调机制
  startListening();

  // 返回清理函数
  return () => {
    stopListening();
    updateCallback = null;
  };
}

function startListening() {
  // 在实际实现中，这里会设置 EventEmitter 监听
  // 或使用 RNIap 的相关API
  // 由于 react-native-iap 会在 purchase 返回时自动调用，
  // 这里的实现主要是处理后台恢复等场景

  // 定期检查未完成交易
  checkPendingTransactions();
}

function stopListening() {
  // 清理监听
  unsubscribe?.();
}

// 检查并处理未完成的交易
async function checkPendingTransactions() {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    for (const purchase of purchases) {
      if (purchase.transactionId && updateCallback) {
        const formattedPurchase: Purchase = {
          transactionId: purchase.transactionId,
          productId: purchase.productId,
          transactionDate: purchase.transactionDate,
          transactionReceipt: purchase.transactionReceipt,
          purchaseToken: purchase.purchaseToken,
        };
        await updateCallback(formattedPurchase);
      }
    }
  } catch (error) {
    console.error('checkPendingTransactions failed:', error);
  }
}

// 手动触发交易处理 (当从服务器收到推送通知时调用)
export async function handleTransactionUpdate(purchase: Purchase): Promise<void> {
  if (updateCallback) {
    await updateCallback(purchase);
  }
}