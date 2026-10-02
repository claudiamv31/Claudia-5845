import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { AuthProvider, useAuth } from './AuthContext';

function SessionProbe() {
  const { user, isAuthenticated, logout, register } = useAuth();

  return (
    <div>
      <span>{isAuthenticated ? user?.fullName : 'Signed out'}</span>
      <span>{user && 'passwordHash' in user ? 'Hash exposed' : 'Hash hidden'}</span>
      <button type="button" onClick={logout}>
        Log out
      </button>
      <button
        type="button"
        onClick={() =>
          void register({
            fullName: 'Grace Snail',
            email: 'grace@example.com',
            password: 'Mollusk123',
          })
        }
      >
        Register another user
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(async () => {
    localStorage.clear();
    await authService.register({
      fullName: 'Ada Caracol',
      email: 'ada@example.com',
      password: 'Caracol123',
    });
  });

  it('restores the authenticated user from persistent storage', async () => {
    await authService.login({
      email: 'ada@example.com',
      password: 'Caracol123',
    });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(screen.getByText('Ada Caracol')).toBeInTheDocument();
    expect(screen.getByText('Hash hidden')).toBeInTheDocument();
  });

  it('updates its state and preserves user data when logging out', async () => {
    await authService.login({
      email: 'ada@example.com',
      password: 'Caracol123',
    });
    const registeredUser = storageService.getUser();

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(screen.getByText('Signed out')).toBeInTheDocument();
    expect(storageService.getSession()).toBeNull();
    expect(storageService.getUser()).toEqual(registeredUser);
  });

  it('signs out when registration replaces the stored user', async () => {
    await authService.login({
      email: 'ada@example.com',
      password: 'Caracol123',
    });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /register another user/i }),
    );

    expect(await screen.findByText('Signed out')).toBeInTheDocument();
    expect(storageService.getSession()).toBeNull();
  });
});
