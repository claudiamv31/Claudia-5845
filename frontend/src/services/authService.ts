import type { User } from '../types/auth';
import { hashPassword, verifyPassword } from '../utils/password';
import { storageService } from './storageService';

export interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
}

export type RegistrationResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'email_exists' };

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'invalid_credentials' };

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

  storageService.saveUser(user);
  return { ok: true, user };
}

async function login(input: LoginInput): Promise<LoginResult> {
  const registeredUser = storageService.getUser();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!registeredUser || registeredUser.email.toLowerCase() !== normalizedEmail) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  const passwordMatches = await verifyPassword(
    input.password,
    registeredUser.passwordHash,
  );

  return passwordMatches
    ? { ok: true, user: registeredUser }
    : { ok: false, reason: 'invalid_credentials' };
}

export const authService = {
  register,
  login,
};
