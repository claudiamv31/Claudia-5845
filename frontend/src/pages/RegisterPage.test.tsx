import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storageService } from '../services/storageService';
import { RegisterPage } from './RegisterPage';

interface RegistrationValues {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

function completeRegistrationForm(
  overrides: Partial<RegistrationValues> = {},
): void {
  const values: RegistrationValues = {
    fullName: 'Ada Caracol',
    email: 'ada@example.com',
    password: 'Caracol123',
    passwordConfirmation: 'Caracol123',
    ...overrides,
  };

  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: values.fullName },
  });
  fireEvent.change(screen.getByLabelText(/^email$/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: values.password },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: values.passwordConfirmation },
  });
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an error when password confirmation does not match', () => {
    render(<RegisterPage />);

    completeRegistrationForm({ passwordConfirmation: 'Different123' });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('registers a user with a hashed password and zero balance', async () => {
    render(<RegisterPage />);

    completeRegistrationForm({ email: 'ADA@EXAMPLE.COM' });

    expect(await screen.findByText(/account created/i)).toBeInTheDocument();
    expect(storageService.getUser()).toMatchObject({
      fullName: 'Ada Caracol',
      email: 'ada@example.com',
      balance: 0,
    });
    expect(storageService.getUser()?.passwordHash).toMatch(
      /^pbkdf2_sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/,
    );
  });

  it('does not replace an account when the email is already registered', async () => {
    const firstRender = render(<RegisterPage />);

    completeRegistrationForm();
    await screen.findByText(/account created/i);
    firstRender.unmount();

    render(<RegisterPage />);
    completeRegistrationForm({
      fullName: 'Grace Snail',
      email: 'ADA@EXAMPLE.COM',
      password: 'Another123',
      passwordConfirmation: 'Another123',
    });

    expect(
      await screen.findByText(/email is already registered/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(storageService.getUser()?.fullName).toBe('Ada Caracol');
  });

  it('shows field errors for invalid registration details', () => {
    render(<RegisterPage />);

    completeRegistrationForm({
      fullName: '',
      email: 'not-an-email',
      password: 'short',
      passwordConfirmation: 'short',
    });

    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(storageService.getUser()).toBeNull();
  });

  it('recovers when secure password processing is unavailable', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(
      new Error('Web Crypto unavailable'),
    );
    render(<RegisterPage />);

    completeRegistrationForm();

    expect(
      await screen.findByText(/could not create your account/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeEnabled();
    expect(storageService.getUser()).toBeNull();
  });
});
