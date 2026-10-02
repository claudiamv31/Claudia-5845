import type { AuthenticatedUser, User } from '../types/auth';
import { hashPassword, verifyPassword } from '../utils/password';
import { storageService } from './storageService';

export interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
}

export type RegistrationResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: 'email_exists' };

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: 'invalid_credentials' };

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    balance: user.balance,
  };
}

async function register(input: RegistrationInput): Promise<RegistrationResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const registeredUser = storageService.getUser();

  if (registeredUser?.email.toLowerCase() === normalizedEmail) {
    return { ok: false, reason: 'email_exists' };
  }

  const user: User = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(input.password),
    balance: 0,
  };

  storageService.clearSession();
  storageService.saveUser(user);
  return { ok: true, user: toAuthenticatedUser(user) };
}

async function login(input: LoginInput): Promise<LoginResult> {
  const registeredUser = storageService.getUser();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (
    !registeredUser ||
    registeredUser.email.toLowerCase() !== normalizedEmail
  ) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  const passwordMatches = await verifyPassword(
    input.password,
    registeredUser.passwordHash,
  );

  if (!passwordMatches) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  storageService.saveSession({
    userId: registeredUser.id,
    authenticated: true,
  });

  return { ok: true, user: toAuthenticatedUser(registeredUser) };
}

function getAuthenticatedUser(): AuthenticatedUser | null {
  const session = storageService.getSession();

  if (!session?.authenticated) {
    return null;
  }

  const registeredUser = storageService.getUser();

  if (!registeredUser || registeredUser.id !== session.userId) {
    return null;
  }

  return toAuthenticatedUser(registeredUser);
}

function logout(): void {
  storageService.clearSession();
}

export const authService = {
  register,
  login,
  getAuthenticatedUser,
  logout,
};
