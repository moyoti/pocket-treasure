/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthProvider';

// Helper component to test the hook
function AuthConsumer() {
  const { user, loading, setUser } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <button
        onClick={() =>
          setUser({
            id: '1',
            email: 'test@test.com',
            username: 'testuser',
            isVerified: true,
            createdAt: '',
            updatedAt: '',
          })
        }
      >
        Login
      </button>
      <button onClick={() => setUser(null)}>Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with loading=true then sets loading=false', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // After useEffect runs, loading should be false
    expect(await screen.findByTestId('loading')).toHaveTextContent('false');
  });

  it('starts with user=null when no stored session', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId('user')).toHaveTextContent('null');
  });

  it('restores user from localStorage on mount', async () => {
    const storedUser = {
      id: '1',
      email: 'stored@test.com',
      username: 'storeduser',
      isVerified: true,
      createdAt: '',
      updatedAt: '',
    };
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('token', 'fake-token');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId('user')).toHaveTextContent('storeduser');
  });

  it('does not restore user if token is missing', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', username: 'nope' })
    );
    // No token set

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId('user')).toHaveTextContent('null');
  });

  it('clears storage on invalid JSON', async () => {
    localStorage.setItem('user', 'not-json');
    localStorage.setItem('token', 'fake-token');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('setUser persists user to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login'));

    expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    expect(localStorage.getItem('user')).toContain('testuser');
  });

  it('setUser(null) clears user and localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'x' }));
    localStorage.setItem('token', 'tok');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Logout'));

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    consoleError.mockRestore();
  });
});
