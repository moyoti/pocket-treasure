import { Platform } from 'react-native';

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
  introductoryPrice?: string;
  subscriptionPeriodUnitIOS?: string;
}

export interface Purchase {
  transactionId: string;
  productId: string;
  transactionDate: string;
  transactionReceipt: string;
  purchaseToken?: string;
  autoRenewingAndroid?: boolean;
  dataAndroid?: string;
  signatureAndroid?: string;
  isAcknowledgedAndroid?: boolean;
  purchaseTokenAndroid?: string;
}

export interface SubscriptionOffer {
  identifier: string;
  state: number;
  productId: string;
  originalTransactionId: string;
  autoRenewing: boolean;
  price: string;
  currency: string;
}