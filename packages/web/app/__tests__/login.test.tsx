/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock AuthProvider
const mockSetUser = jest.fn();
let mockAuthState = { user: null as any, loading: false, setUser: mockSetUser };
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

// Mock API
const mockLogin = jest.fn();
jest.mock('@/lib/api', () => ({
  login: (...args: any[]) => mockLogin(...args),
}));

import LoginPage from '../login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { user: null, loading: false, setUser: mockSetUser };
  });

  it('renders login form with email and password fields', async () => {
    render(<LoginPage />);

    expect(await screen.findByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
  });

  it('renders the submit button', async () => {
    render(<LoginPage />);

    expect(await screen.findByText('开始探险')).toBeInTheDocument();
  });

  it('renders link to register page', async () => {
    render(<LoginPage />);

    const link = await screen.findByText('立即注册');
    expect(link).toHaveAttribute('href', '/register');
  });

  it('shows loading state during auth check', () => {
    mockAuthState = { user: null, loading: true, setUser: mockSetUser };

    const { container } = render(<LoginPage />);
    // Shows loader during auth loading
    expect(container.querySelector('.cartoon-loader')).toBeInTheDocument();
  });

  it('redirects to /map if user is already logged in', () => {
    mockAuthState = {
      user: { id: '1', username: 'test', email: 'test@test.com' },
      loading: false,
      setUser: mockSetUser,
    };

    render(<LoginPage />);
    expect(mockPush).toHaveBeenCalledWith('/map');
  });

  it('submits login form and redirects on success', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      user: { id: '1', username: 'test', email: 'test@test.com' },
      token: 'jwt-token',
    });

    render(<LoginPage />);

    const emailInput = await screen.findByLabelText(/邮箱/);
    const passwordInput = screen.getByLabelText(/密码/);

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByText('开始探险'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/map');
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginPage />);

    const emailInput = await screen.findByLabelText(/邮箱/);
    const passwordInput = screen.getByLabelText(/密码/);

    await user.type(emailInput, 'bad@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(screen.getByText('开始探险'));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows success message when redirected from registration', async () => {
    // Simulate ?registered=true
    mockSearchParams.set('registered', 'true');

    render(<LoginPage />);

    expect(await screen.findByText('注册成功！请登录')).toBeInTheDocument();

    // Cleanup
    mockSearchParams.delete('registered');
  });

  it('disables submit button during loading', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue(new Promise(() => {})); // never resolves

    render(<LoginPage />);

    const emailInput = await screen.findByLabelText(/邮箱/);
    const passwordInput = screen.getByLabelText(/密码/);

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByText('开始探险'));

    await waitFor(() => {
      expect(screen.getByText('登录中...')).toBeInTheDocument();
    });
  });
});
