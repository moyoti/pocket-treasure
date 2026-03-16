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
  user: { id: '1', username: 'test' } as any,
  loading: false,
};
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

// Mock AchievementCard
jest.mock('@/components/AchievementCard', () => {
  return function MockAchievementCard({ achievement, onClaim, isClaiming }: any) {
    return (
      <div data-testid={`achievement-${achievement.achievement.id}`}>
        <span>{achievement.achievement.name}</span>
        {achievement.canClaim && (
          <button
            onClick={() => onClaim(achievement.achievement.id)}
            disabled={isClaiming}
          >
            Claim
          </button>
        )}
      </div>
    );
  };
});

// Mock API
const mockGetUserAchievements = jest.fn();
const mockClaimAchievementReward = jest.fn();
jest.mock('@/lib/api', () => ({
  getUserAchievements: () => mockGetUserAchievements(),
  claimAchievementReward: (id: string) => mockClaimAchievementReward(id),
}));

import AchievementsPage from '../achievements/page';

const mockAchievements = [
  {
    achievement: {
      id: 'ach-1',
      name: '初级收藏家',
      description: '收集10个物品',
      icon: '',
      type: 'collection',
      requirement: 10,
      tier: 1,
      rewards: { coins: 100, experience: 50 },
      createdAt: '',
      updatedAt: '',
    },
    progress: 10,
    requirement: 10,
    status: 'completed',
    completedAt: null,
    claimedAt: null,
    canClaim: true,
  },
  {
    achievement: {
      id: 'ach-2',
      name: '探索者',
      description: '探索5个地标',
      icon: '',
      type: 'distance',
      requirement: 5,
      tier: 1,
      rewards: { coins: 50, experience: 25 },
      createdAt: '',
      updatedAt: '',
    },
    progress: 2,
    requirement: 5,
    status: 'in_progress',
    completedAt: null,
    claimedAt: null,
    canClaim: false,
  },
  {
    achievement: {
      id: 'ach-3',
      name: '资深玩家',
      description: '收集100个物品',
      icon: '',
      type: 'collection',
      requirement: 100,
      tier: 2,
      rewards: { coins: 500, experience: 200 },
      createdAt: '',
      updatedAt: '',
    },
    progress: 100,
    requirement: 100,
    status: 'claimed',
    completedAt: new Date(),
    claimedAt: new Date(),
    canClaim: false,
  },
];

describe('AchievementsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAuthState = { user: { id: '1', username: 'test' }, loading: false };
    mockGetUserAchievements.mockResolvedValue(mockAchievements);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthState = { user: null, loading: false };
    render(<AchievementsPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows loading state', () => {
    mockAuthState = { ...mockAuthState, loading: true };
    const { container } = render(<AchievementsPage />);
    expect(container.querySelector('.cartoon-loader')).toBeInTheDocument();
  });

  it('renders achievement list', async () => {
    render(<AchievementsPage />);

    expect(await screen.findByText('初级收藏家')).toBeInTheDocument();
    expect(screen.getByText('探索者')).toBeInTheDocument();
    expect(screen.getByText('资深玩家')).toBeInTheDocument();
  });

  it('renders stats card with completed count', async () => {
    render(<AchievementsPage />);

    // 1 claimed out of 3 total
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();
  });

  it('shows claimable count', async () => {
    render(<AchievementsPage />);

    expect(await screen.findByText('1 个奖励待领取')).toBeInTheDocument();
  });

  it('renders empty state when no achievements', async () => {
    mockGetUserAchievements.mockResolvedValue([]);

    render(<AchievementsPage />);

    expect(await screen.findByText('暂无成就')).toBeInTheDocument();
    expect(screen.getByText('开始收集宝藏来解锁成就')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    mockGetUserAchievements.mockRejectedValue(new Error('Network error'));

    render(<AchievementsPage />);

    expect(await screen.findByText('加载成就失败')).toBeInTheDocument();
  });

  it('renders page header', async () => {
    render(<AchievementsPage />);

    expect(await screen.findByText('成就')).toBeInTheDocument();
  });
});
