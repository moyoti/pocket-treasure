/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock AuthProvider
let mockAuthState = {
  user: { id: 'user-1', username: 'testplayer', email: 'test@test.com' } as any,
  loading: false,
};
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

// Mock LocaleContext
jest.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'leaderboard.title': '排行榜',
        'leaderboard.myRank': '我的排名',
        'leaderboard.noData': '暂无排名数据',
        'leaderboard.goCollect': '去收集',
        'profile.stats.collections': '个收藏',
      };
      return map[key] || key;
    },
  }),
}));

// Mock API
const mockLeaderboardGet = jest.fn();
const mockRankGet = jest.fn();
jest.mock('@/lib/api', () => {
  return {
    __esModule: true,
    default: {
      get: (url: string) => {
        if (url === '/leaderboard') return mockLeaderboardGet();
        if (url === '/leaderboard/me') return mockRankGet();
        return Promise.reject(new Error('Unknown URL'));
      },
    },
  };
});

import LeaderboardPage from '../leaderboard/page';

const mockLeaderboard = [
  { rank: 1, userId: 'u1', username: 'champion', avatar: null, collectionCount: 100 },
  { rank: 2, userId: 'u2', username: 'runner', avatar: null, collectionCount: 80 },
  { rank: 3, userId: 'u3', username: 'bronze', avatar: null, collectionCount: 60 },
  { rank: 4, userId: 'user-1', username: 'testplayer', avatar: null, collectionCount: 50 },
  { rank: 5, userId: 'u5', username: 'fifth', avatar: null, collectionCount: 30 },
];

describe('LeaderboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: { id: 'user-1', username: 'testplayer', email: 'test@test.com' },
      loading: false,
    };
    mockLeaderboardGet.mockResolvedValue({ data: mockLeaderboard });
    mockRankGet.mockResolvedValue({ data: { rank: 4 } });
  });

  it('redirects to login when not authenticated', () => {
    mockAuthState = { user: null, loading: false };
    render(<LeaderboardPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders the leaderboard title', async () => {
    render(<LeaderboardPage />);

    expect(await screen.findByText('排行榜')).toBeInTheDocument();
  });

  it('renders top 3 users in podium', async () => {
    render(<LeaderboardPage />);

    expect(await screen.findByText('champion')).toBeInTheDocument();
    expect(screen.getByText('runner')).toBeInTheDocument();
    expect(screen.getByText('bronze')).toBeInTheDocument();
  });

  it('renders rank 4+ in list', async () => {
    render(<LeaderboardPage />);

    // testplayer appears in both "my rank" card and in the list
    await waitFor(() => {
      expect(screen.getAllByText('testplayer').length).toBeGreaterThanOrEqual(1);
    });
    expect(await screen.findByText('fifth')).toBeInTheDocument();
  });

  it('shows my rank card', async () => {
    render(<LeaderboardPage />);

    await waitFor(() => {
      // #4 may appear multiple times (in my rank card and in the list)
      const rankElements = screen.getAllByText((content, element) => {
        return element?.textContent === '#4';
      });
      expect(rankElements.length).toBeGreaterThanOrEqual(1);
    });
    expect(await screen.findByText('我的排名')).toBeInTheDocument();
  });

  it('renders empty state when no data', async () => {
    mockLeaderboardGet.mockResolvedValue({ data: [] });
    mockRankGet.mockResolvedValue({ data: { rank: null } });

    render(<LeaderboardPage />);

    expect(await screen.findByText('暂无排名数据')).toBeInTheDocument();
  });

  it('renders collection counts for top entries', async () => {
    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
