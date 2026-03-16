/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the API
jest.mock('@/lib/api', () => ({
  getCoinBalance: jest.fn(),
}));

import Wallet from '../Wallet';
import { getCoinBalance } from '@/lib/api';

const mockGetCoinBalance = getCoinBalance as jest.MockedFunction<typeof getCoinBalance>;

describe('Wallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetCoinBalance.mockReturnValue(new Promise(() => {})); // never resolves
    render(<Wallet />);

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('displays balance after loading', async () => {
    mockGetCoinBalance.mockResolvedValue({ balance: 1500 });

    render(<Wallet />);

    await waitFor(() => {
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });
  });

  it('displays exact number for small balances', async () => {
    mockGetCoinBalance.mockResolvedValue({ balance: 42 });

    render(<Wallet />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    mockGetCoinBalance.mockRejectedValue(new Error('Network error'));

    render(<Wallet />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('calls onBalanceChange callback', async () => {
    const onBalanceChange = jest.fn();
    mockGetCoinBalance.mockResolvedValue({ balance: 100 });

    render(<Wallet onBalanceChange={onBalanceChange} />);

    await waitFor(() => {
      expect(onBalanceChange).toHaveBeenCalledWith(100);
    });
  });

  it('renders detailed stats when showStats is true', async () => {
    mockGetCoinBalance.mockResolvedValue({
      balance: 5000,
      totalEarned: 10000,
      totalSpent: 5000,
    });

    render(<Wallet showStats />);

    await waitFor(() => {
      expect(screen.getByText('Gold Coins')).toBeInTheDocument();
      expect(screen.getByText('Total Earned')).toBeInTheDocument();
      expect(screen.getByText('Total Spent')).toBeInTheDocument();
    });
  });

  it('formats millions correctly', async () => {
    mockGetCoinBalance.mockResolvedValue({ balance: 2500000 });

    render(<Wallet />);

    await waitFor(() => {
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });
  });
});
