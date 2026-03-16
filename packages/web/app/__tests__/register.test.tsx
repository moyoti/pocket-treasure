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

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock AuthProvider
let mockAuthState = { user: null as any, loading: false };
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

// Mock API
const mockRegister = jest.fn();
jest.mock('@/lib/api', () => ({
  register: (...args: any[]) => mockRegister(...args),
}));

import RegisterPage from '../register/page';

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { user: null, loading: false };
  });

  it('renders register form with username, email, and password fields', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<RegisterPage />);

    const link = screen.getByText('立即登录');
    expect(link).toHaveAttribute('href', '/login');
  });

  it('shows loading state during auth check', () => {
    mockAuthState = { user: null, loading: true };

    const { container } = render(<RegisterPage />);
    expect(container.querySelector('.cartoon-loader')).toBeInTheDocument();
  });

  it('redirects to /map if user is already logged in', () => {
    mockAuthState = {
      user: { id: '1', username: 'test' },
      loading: false,
    };

    render(<RegisterPage />);
    expect(mockPush).toHaveBeenCalledWith('/map');
  });

  it('validates empty username', async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/邮箱/);
    const passwordInput = screen.getByLabelText(/密码/);

    // Leave username empty but fill others
    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByText('开始探险'));

    // The form has required attribute, but the component also checks manually
    // Since the input has `required`, the browser validation should catch it
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/用户名/), 'testuser');
    await user.type(screen.getByLabelText(/邮箱/), 'test@test.com');
    await user.type(screen.getByLabelText(/密码/), '12345'); // too short
    await user.click(screen.getByText('开始探险'));

    expect(await screen.findByText('密码至少需要6位')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits form and redirects to login on success', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: true });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/用户名/), 'newuser');
    await user.type(screen.getByLabelText(/邮箱/), 'new@test.com');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByText('开始探险'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('new@test.com', 'password123', 'newuser');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?registered=true');
    });
  });

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('Email already exists'));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/用户名/), 'existinguser');
    await user.type(screen.getByLabelText(/邮箱/), 'existing@test.com');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByText('开始探险'));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockReturnValue(new Promise(() => {}));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/用户名/), 'newuser');
    await user.type(screen.getByLabelText(/邮箱/), 'new@test.com');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByText('开始探险'));

    await waitFor(() => {
      expect(screen.getByText('注册中...')).toBeInTheDocument();
    });
  });
});
