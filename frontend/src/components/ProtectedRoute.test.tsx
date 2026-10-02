import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ProtectedRoute } from './ProtectedRoute';

function renderProtectedPage(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<h1>Sign in</h1>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <h1>Private dashboard</h1>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated visitors to login', () => {
    renderProtectedPage();

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /private dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it('renders protected content for an authenticated user', async () => {
    await authService.register({
      fullName: 'Ada Caracol',
      email: 'ada@example.com',
      password: 'Caracol123',
    });
    await authService.login({
      email: 'ada@example.com',
      password: 'Caracol123',
    });

    renderProtectedPage();

    expect(
      screen.getByRole('heading', { name: /private dashboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });
});
