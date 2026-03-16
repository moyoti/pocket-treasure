/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock AuthProvider
let mockAuthState = {
  user: { id: '1', username: 'test', email: 'test@test.com' } as any,
  loading: false,
};
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

// Mock Icon component
jest.mock('@/components/Icon', () => ({
  TreasureIcon: ({ rarity }: any) => <span data-testid="treasure-icon">{rarity}</span>,
  RARITY_COLORS: {
    common: '#6B7280',
    rare: '#0EA5E9',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  },
}));

// Mock API
const mockGetInventory = jest.fn();
const mockGetInventoryStats = jest.fn();
const mockGetCoinBalance = jest.fn();
const mockSellItemToNPC = jest.fn();

jest.mock('@/lib/api', () => ({
  getInventory: () => mockGetInventory(),
  getInventoryStats: () => mockGetInventoryStats(),
  getCoinBalance: () => mockGetCoinBalance(),
  sellItemToNPC: (data: any) => mockSellItemToNPC(data),
}));

import InventoryPage from '../inventory/page';

const mockItems = [
  {
    id: 'inv-1',
    userId: '1',
    itemId: 'item-1',
    quantity: 3,
    collectedLatitude: 39.9,
    collectedLongitude: 116.3,
    poiName: '天安门',
    collectedAt: '2024-01-01',
    item: {
      id: 'item-1',
      name: '古铜镜',
      description: '一面古老的铜镜',
      rarity: 'rare',
      type: 'collectible',
      spawnWeight: 0.5,
      maxStack: 99,
      createdAt: '',
      updatedAt: '',
    },
  },
  {
    id: 'inv-2',
    userId: '1',
    itemId: 'item-2',
    quantity: 1,
    collectedLatitude: 39.9,
    collectedLongitude: 116.3,
    collectedAt: '2024-01-01',
    item: {
      id: 'item-2',
      name: '传说之剑',
      description: '传说级别的宝剑',
      rarity: 'legendary',
      type: 'collectible',
      spawnWeight: 0.05,
      maxStack: 99,
      createdAt: '',
      updatedAt: '',
    },
  },
];

const mockStats = {
  totalItems: 4,
  uniqueItems: 2,
  byRarity: { rare: 3, legendary: 1 },
};

describe('InventoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: { id: '1', username: 'test', email: 'test@test.com' },
      loading: false,
    };
    mockGetInventory.mockResolvedValue(mockItems);
    mockGetInventoryStats.mockResolvedValue(mockStats);
    mockGetCoinBalance.mockResolvedValue({ balance: 500 });
  });

  it('renders loading state initially', () => {
    mockAuthState = { user: { id: '1', username: 'test', email: 'test@test.com' }, loading: true };
    const { container } = render(<InventoryPage />);
    expect(container.querySelector('.cartoon-loader')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthState = { user: null, loading: false };
    render(<InventoryPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders inventory items after loading', async () => {
    render(<InventoryPage />);

    expect(await screen.findByText('古铜镜')).toBeInTheDocument();
    expect(screen.getByText('传说之剑')).toBeInTheDocument();
  });

  it('renders item quantities', async () => {
    render(<InventoryPage />);

    expect(await screen.findByText('x3')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
  });

  it('renders item descriptions', async () => {
    render(<InventoryPage />);

    expect(await screen.findByText('一面古老的铜镜')).toBeInTheDocument();
    expect(screen.getByText('传说级别的宝剑')).toBeInTheDocument();
  });

  it('renders POI name when available', async () => {
    render(<InventoryPage />);

    expect(await screen.findByText('天安门')).toBeInTheDocument();
  });

  it('renders coin balance', async () => {
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  it('renders stats when available', async () => {
    render(<InventoryPage />);

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument(); // totalItems
      expect(screen.getByText('2')).toBeInTheDocument(); // uniqueItems
    });
  });

  it('renders empty state when no items', async () => {
    mockGetInventory.mockResolvedValue([]);
    mockGetInventoryStats.mockResolvedValue({
      totalItems: 0,
      uniqueItems: 0,
      byRarity: {},
    });

    render(<InventoryPage />);

    expect(await screen.findByText('还没有收集物品')).toBeInTheDocument();
    expect(screen.getByText('去地图探索寻找宝藏吧！')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    mockGetInventory.mockRejectedValue(new Error('Network error'));

    render(<InventoryPage />);

    expect(await screen.findByText('加载背包失败')).toBeInTheDocument();
  });

  it('renders sell buttons for each item', async () => {
    render(<InventoryPage />);

    await waitFor(() => {
      const sellButtons = screen.getAllByText('出售');
      expect(sellButtons.length).toBe(2);
    });
  });

  it('renders header with title', async () => {
    render(<InventoryPage />);

    expect(await screen.findByText('我的收藏')).toBeInTheDocument();
  });
});
