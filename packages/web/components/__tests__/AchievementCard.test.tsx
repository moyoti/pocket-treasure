/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AchievementCard from '../AchievementCard';
import { AchievementProgress } from '@/types';

const baseAchievement: AchievementProgress = {
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
  progress: 5,
  requirement: 10,
  status: 'in_progress',
  completedAt: null,
  claimedAt: null,
  canClaim: false,
};

describe('AchievementCard', () => {
  const onClaim = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders achievement name and description', () => {
    render(<AchievementCard achievement={baseAchievement} onClaim={onClaim} />);

    expect(screen.getByText('初级收藏家')).toBeInTheDocument();
    expect(screen.getByText('收集10个物品')).toBeInTheDocument();
  });

  it('renders progress text', () => {
    render(<AchievementCard achievement={baseAchievement} onClaim={onClaim} />);

    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('renders reward information', () => {
    render(<AchievementCard achievement={baseAchievement} onClaim={onClaim} />);

    expect(screen.getByText('100')).toBeInTheDocument(); // coins
    expect(screen.getByText('50')).toBeInTheDocument(); // experience
  });

  it('does not show claim button when cannot claim', () => {
    render(<AchievementCard achievement={baseAchievement} onClaim={onClaim} />);

    expect(screen.queryByText('领取')).not.toBeInTheDocument();
  });

  it('shows claim button when canClaim is true', () => {
    const claimable = { ...baseAchievement, canClaim: true, progress: 10 };
    render(<AchievementCard achievement={claimable} onClaim={onClaim} />);

    expect(screen.getByText('领取')).toBeInTheDocument();
  });

  it('calls onClaim with achievement ID when claim button clicked', async () => {
    const user = userEvent.setup();
    const claimable = { ...baseAchievement, canClaim: true, progress: 10 };
    render(<AchievementCard achievement={claimable} onClaim={onClaim} />);

    await user.click(screen.getByText('领取'));
    expect(onClaim).toHaveBeenCalledWith('ach-1');
  });

  it('shows loading spinner when isClaiming', () => {
    const claimable = { ...baseAchievement, canClaim: true, progress: 10 };
    const { container } = render(
      <AchievementCard achievement={claimable} onClaim={onClaim} isClaiming />
    );

    // The button should be disabled and show a spinner (Loader2 renders an svg with animate-spin)
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('shows claimed status with reduced opacity', () => {
    const claimed = {
      ...baseAchievement,
      status: 'claimed' as const,
      progress: 10,
    };
    const { container } = render(
      <AchievementCard achievement={claimed} onClaim={onClaim} />
    );

    // The root element should have opacity-70 class
    expect(container.firstChild).toHaveClass('opacity-70');
  });

  it('does not show claim button for already claimed achievement', () => {
    const claimed = {
      ...baseAchievement,
      status: 'claimed' as const,
      progress: 10,
    };
    render(<AchievementCard achievement={claimed} onClaim={onClaim} />);

    expect(screen.queryByText('领取')).not.toBeInTheDocument();
  });

  it('shows achievement type name', () => {
    render(<AchievementCard achievement={baseAchievement} onClaim={onClaim} />);

    expect(screen.getByText('收集成就')).toBeInTheDocument();
  });

  it('renders achievement icon when provided', () => {
    const withIcon = {
      ...baseAchievement,
      achievement: { ...baseAchievement.achievement, icon: '🏆' },
    };
    render(<AchievementCard achievement={withIcon} onClaim={onClaim} />);

    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders title reward when present', () => {
    const withTitle = {
      ...baseAchievement,
      achievement: {
        ...baseAchievement.achievement,
        rewards: { coins: 100, experience: 50, title: '探险家' },
      },
    };
    render(<AchievementCard achievement={withTitle} onClaim={onClaim} />);

    expect(screen.getByText('探险家')).toBeInTheDocument();
  });
});
