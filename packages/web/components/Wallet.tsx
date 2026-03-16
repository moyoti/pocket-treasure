'use client';

import { useEffect, useState } from 'react';
import { getCoinBalance } from '@/lib/api';
import { CoinBalance } from '@/types';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface WalletProps {
  showStats?: boolean;
  onBalanceChange?: (balance: number) => void;
}

export default function Wallet({ showStats = false, onBalanceChange }: WalletProps) {
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalance = async () => {
    try {
      const data = await getCoinBalance();
      setBalance(data);
      onBalanceChange?.(data.balance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-400 rounded-full px-4 py-2">
        <Coins className="w-5 h-5 text-yellow-600 animate-pulse" />
        <span className="font-bold text-yellow-700">...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-100 border-2 border-red-400 rounded-full px-4 py-2">
        <Coins className="w-5 h-5 text-red-600" />
        <span className="font-bold text-red-700">Error</span>
      </div>
    );
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (showStats && balance) {
    return (
      <div className="cartoon-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center border-2 border-gray-800">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Gold Coins</p>
              <p className="text-2xl font-black text-yellow-600">{formatNumber(balance.balance)}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="font-bold text-green-600">{formatNumber(balance.totalEarned)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="font-bold text-red-600">{formatNumber(balance.totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-3 border-yellow-400 rounded-full px-4 py-2 shadow-md">
      <Coins className="w-5 h-5 text-yellow-600" />
      <span className="font-black text-yellow-700 text-lg">{formatNumber(balance?.balance || 0)}</span>
    </div>
  );
}