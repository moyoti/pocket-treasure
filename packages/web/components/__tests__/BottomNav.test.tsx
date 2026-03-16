/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock AuthProvider
const mockUseAuth = jest.fn();
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock LocaleContext
jest.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.map': '地图',
        'nav.inventory': '背包',
        'nav.shop': '商店',
        'nav.gacha': '抽奖',
        'nav.market': '市场',
        'nav.profile': '我的',
      };
      return translations[key] || key;
    },
  }),
}));

import BottomNav from '../BottomNav';

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/map');
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'test' },
      loading: false,
    });
  });

  it('renders navigation items when user is logged in', () => {
    render(<BottomNav />);

    expect(screen.getByText('地图')).toBeInTheDocument();
    expect(screen.getByText('背包')).toBeInTheDocument();
    expect(screen.getByText('商店')).toBeInTheDocument();
    expect(screen.getByText('我的')).toBeInTheDocument();
  });

  it('returns null when loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null on login page', () => {
    mockUsePathname.mockReturnValue('/login');

    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null on register page', () => {
    mockUsePathname.mockReturnValue('/register');

    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it('renders links with correct hrefs', () => {
    render(<BottomNav />);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));

    expect(hrefs).toContain('/map');
    expect(hrefs).toContain('/inventory');
    expect(hrefs).toContain('/profile');
  });

  it('highlights active nav item based on current pathname', () => {
    mockUsePathname.mockReturnValue('/inventory');

    render(<BottomNav />);

    // The active item text should have the amber color class
    const inventoryText = screen.getByText('背包');
    expect(inventoryText).toHaveClass('text-amber-600');

    // Non-active items should have gray class
    const mapText = screen.getByText('地图');
    expect(mapText).toHaveClass('text-gray-400');
  });

  it('highlights item for nested routes', () => {
    mockUsePathname.mockReturnValue('/profile/settings');

    render(<BottomNav />);

    const profileText = screen.getByText('我的');
    expect(profileText).toHaveClass('text-amber-600');
  });
});
