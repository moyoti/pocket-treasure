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
const mockSetUser = jest.fn();
let mockAuthState = {
  user: { id: '1', username: 'TestPlayer', email: 'test@test.com' } as any,
  loading: false,
  setUser: mockSetUser,
};
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

// Mock API
const mockLogout = jest.fn();
const mockGetCoinBalance = jest.fn();
jest.mock('@/lib/api', () => ({
  logout: () => mockLogout(),
  getCoinBalance: () => mockGetCoinBalance(),
}));

import ProfilePage from '../profile/page';

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: { id: '1', username: 'TestPlayer', email: 'test@test.com' },
      loading: false,
      setUser: mockSetUser,
    };
    mockGetCoinBalance.mockResolvedValue({ balance: 1000 });
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
  });

  it('shows loading state during auth check', () => {
    mockAuthState = { ...mockAuthState, loading: true };

    const { container } = render(<ProfilePage />);
    expect(container.querySelector('.cartoon-loader')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockAuthState = { ...mockAuthState, user: null };

    render(<ProfilePage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders username and email', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('renders user avatar initial', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('T')).toBeInTheDocument();
  });

  it('renders coin balance', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/1,000/)).toBeInTheDocument();
    });
  });

  it('renders menu items', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('商店')).toBeInTheDocument();
    expect(screen.getByText('抽奖')).toBeInTheDocument();
    expect(screen.getByText('市场')).toBeInTheDocument();
    expect(screen.getByText('好友')).toBeInTheDocument();
    expect(screen.getByText('聊天')).toBeInTheDocument();
    expect(screen.getByText('成就')).toBeInTheDocument();
    expect(screen.getByText('统计')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
    expect(screen.getByText('帮助')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
  });

  it('navigates to menu item page on click', async () => {
    const user = userEvent.setup();

    render(<ProfilePage />);

    await user.click(await screen.findByText('商店'));
    expect(mockPush).toHaveBeenCalledWith('/shop');
  });

  it('renders logout button', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('退出登录')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);

    render(<ProfilePage />);

    await user.click(await screen.findByText('退出登录'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(null);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows version info in About item', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('v1.0.0')).toBeInTheDocument();
  });

  it('renders page header', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('个人中心')).toBeInTheDocument();
  });
});
