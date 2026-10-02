import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { authService } from './services/authService';
import { storageService } from './services/storageService';

const testUser = {
  fullName: 'Ada Caracol',
  email: 'ada@example.com',
  password: 'Caracol123',
};

async function renderAuthenticatedDashboard(): Promise<void> {
  await authService.register(testUser);
  await authService.login({
    email: testUser.email,
    password: testUser.password,
  });

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('dashboard route', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the authenticated user and current balance', async () => {
    await renderAuthenticatedDashboard();

    expect(
      screen.getByRole('heading', { name: /welcome, ada caracol/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add funds/i }),
    ).toBeDisabled();
  });

  it('describes won and lost bets in the performance chart', async () => {
    await renderAuthenticatedDashboard();

    expect(
      screen.getByRole('img', {
        name: /bet outcomes: 14 won and 6 lost/i,
      }),
    ).toBeInTheDocument();
  });

  it('describes the victory total for every snail', async () => {
    await renderAuthenticatedDashboard();

    expect(
      screen.getByRole('img', {
        name: /snail victories: turbo 2, shelly 1, rocket 1, dash 0, peanut 1, flash 1/i,
      }),
    ).toBeInTheDocument();
  });

  it('returns to login after logout without deleting the account', async () => {
    await renderAuthenticatedDashboard();
    const registeredUser = storageService.getUser();

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(storageService.getSession()).toBeNull();
    expect(storageService.getUser()).toEqual(registeredUser);
  });

  it('opens the dashboard after a valid login', async () => {
    await authService.register(testUser);
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: testUser.email },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: testUser.password },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByRole('heading', { name: /welcome, ada caracol/i }),
    ).toBeInTheDocument();
  });
});
