import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { LoginPage } from './LoginPage';

function submitLogin(email: string, password: string): void {
  fireEvent.change(screen.getByLabelText(/^email$/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

function renderLogin(): void {
  render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await authService.register({
      fullName: 'Ada Caracol',
      email: 'ada@example.com',
      password: 'Caracol123',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticates a registered user with valid credentials', async () => {
    renderLogin();

    submitLogin('ADA@EXAMPLE.COM', 'Caracol123');

    expect(
      await screen.findByText(/welcome back, ada caracol/i),
    ).toBeInTheDocument();
    expect(storageService.getSession()).toEqual({
      userId: storageService.getUser()?.id,
      authenticated: true,
    });
  });

  it('shows a generic error for invalid credentials', async () => {
    renderLogin();

    submitLogin('ada@example.com', 'WrongPassword');

    expect(
      await screen.findByText(/email or password is incorrect/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Caracol123' },
    });

    expect(
      screen.queryByText(/email or password is incorrect/i),
    ).not.toBeInTheDocument();
    expect(storageService.getSession()).toBeNull();
  });

  it('uses the same generic error for an unknown email', async () => {
    renderLogin();

    submitLogin('unknown@example.com', 'Caracol123');

    expect(
      await screen.findByText(/email or password is incorrect/i),
    ).toBeInTheDocument();
  });

  it('shows field errors for invalid login details', () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(storageService.getSession()).toBeNull();
  });

  it('recovers when secure password verification is unavailable', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(
      new Error('Web Crypto unavailable'),
    );
    renderLogin();

    submitLogin('ada@example.com', 'Caracol123');

    expect(
      await screen.findByText(/could not sign you in/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    expect(storageService.getSession()).toBeNull();
  });
});
