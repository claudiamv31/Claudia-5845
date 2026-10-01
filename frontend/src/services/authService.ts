import type { User } from '../types/auth';
import { hashPassword } from '../utils/password';
import { storageService } from './storageService';

export interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
}

export type RegistrationResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'email_exists' };

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

export const authService = {
  register,
};
