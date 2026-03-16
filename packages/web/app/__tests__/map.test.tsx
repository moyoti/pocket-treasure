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

// Mock next/dynamic - render the loading fallback
jest.mock('next/dynamic', () => {
  return function mockDynamic(importFn: any, options: any) {
    return function DynamicComponent(props: any) {
      return <div data-testid="map-content">MapContent loaded</div>;
    };
  };
});

// Mock AuthProvider
let mockAuthState = {
  user: { id: '1', username: 'test' } as any,
  loading: false,
};
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

import MapPage from '../map/page';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

describe('MapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { user: { id: '1', username: 'test' }, loading: false };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  it('redirects to login when not authenticated', () => {
    mockAuthState = { user: null, loading: false };

    render(<MapPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows auth loading state', () => {
    mockAuthState = { ...mockAuthState, loading: true };

    const { container } = render(<MapPage />);
    expect(container.querySelector('.cartoon-loader')).toBeInTheDocument();
  });

  it('shows location loading state while fetching position', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Never calls callback
    });

    render(<MapPage />);

    // Updated text from the refactored MapPage
    expect(screen.getByText('正在获取位置')).toBeInTheDocument();
  });

  it('renders map content after getting location', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 39.9, longitude: 116.3 },
      });
    });

    render(<MapPage />);

    expect(await screen.findByTestId('map-content')).toBeInTheDocument();
  });

  it('falls back to default location on geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error({ code: 1, message: 'User denied' });
    });

    render(<MapPage />);

    await waitFor(() => {
      expect(screen.getByText(/无法获取位置/)).toBeInTheDocument();
    });
    expect(screen.getByTestId('map-content')).toBeInTheDocument();
  });

  it('returns null when user is not authenticated', () => {
    mockAuthState = { user: null, loading: false };

    const { container } = render(<MapPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
