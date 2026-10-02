import { beforeEach, describe, expect, it } from 'vitest';
import { authService } from './authService';
import { storageService } from './storageService';

const credentials = {
  email: 'ada@example.com',
  password: 'Caracol123',
};

describe('authService session lifecycle', () => {
  beforeEach(async () => {
    localStorage.clear();
    await authService.register({
      fullName: 'Ada Caracol',
      ...credentials,
    });
  });

  it('creates a persistent session after a valid login', async () => {
    const result = await authService.login(credentials);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user).not.toHaveProperty('passwordHash');
    }
    expect(storageService.getSession()).toEqual({
      userId: storageService.getUser()?.id,
      authenticated: true,
    });
    expect(authService.getAuthenticatedUser()).not.toHaveProperty(
      'passwordHash',
    );
  });

  it('does not create a session after an invalid login', async () => {
    await authService.login({ ...credentials, password: 'WrongPassword' });

    expect(storageService.getSession()).toBeNull();
    expect(authService.getAuthenticatedUser()).toBeNull();
  });

  it('logs out without deleting the registered user', async () => {
    await authService.login(credentials);
    const registeredUser = storageService.getUser();

    authService.logout();

    expect(storageService.getSession()).toBeNull();
    expect(storageService.getUser()).toEqual(registeredUser);
  });

  it('invalidates an existing session when registering another user', async () => {
    await authService.login(credentials);

    await authService.register({
      fullName: 'Grace Snail',
      email: 'grace@example.com',
      password: 'Mollusk123',
    });

    expect(storageService.getSession()).toBeNull();
    expect(authService.getAuthenticatedUser()).toBeNull();
  });
});
