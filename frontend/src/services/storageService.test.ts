import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, User } from '../types/auth';
import type { Transaction } from '../types/transaction';
import { storageService } from './storageService';

const user: User = {
  id: 'user-1',
  fullName: 'Ada Caracol',
  email: 'ada@example.com',
  passwordHash: 'hashed-password',
  balance: 0,
};

const session: Session = {
  userId: user.id,
  authenticated: true,
};

const transaction: Transaction = {
  id: 'transaction-1',
  status: 'approved',
  amount: 500,
  createdAt: '2026-09-30T18:00:00.000Z',
  reference: 'SNAIL-001',
};

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists and retrieves the registered user', () => {
    expect(storageService.getUser()).toBeNull();

    storageService.saveUser(user);

    expect(storageService.getUser()).toEqual(user);
  });

  it('persists and clears only the active session', () => {
    storageService.saveUser(user);
    storageService.saveSession(session);

    expect(storageService.getSession()).toEqual(session);

    storageService.clearSession();

    expect(storageService.getSession()).toBeNull();
    expect(storageService.getUser()).toEqual(user);
  });

  it('updates the registered user balance', () => {
    storageService.saveUser(user);

    const updatedUser = storageService.updateBalance(500);

    expect(updatedUser).toEqual({ ...user, balance: 500 });
    expect(storageService.getUser()).toEqual({ ...user, balance: 500 });
  });

  it('starts with an empty history and appends an approved transaction', () => {
    expect(storageService.getTransactions()).toEqual([]);

    storageService.saveTransaction(transaction);

    expect(storageService.getTransactions()).toEqual([transaction]);
  });

  it('returns empty state when persisted JSON cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{invalid-json');

    expect(storageService.getUser()).toBeNull();
    expect(storageService.getSession()).toBeNull();
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('returns empty state when persisted JSON has the wrong shape', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{}');

    expect(storageService.getUser()).toBeNull();
    expect(storageService.getSession()).toBeNull();
    expect(storageService.getTransactions()).toEqual([]);
  });
});
