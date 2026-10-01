import type { Session, User } from '../types/auth';
import type { Transaction } from '../types/transaction';

const STORAGE_KEYS = {
  user: 'snail-racing:user',
  session: 'snail-racing:session',
  transactions: 'snail-racing:transactions',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

type ValueGuard<T> = (value: unknown) => value is T;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.fullName === 'string' &&
    typeof value.email === 'string' &&
    typeof value.passwordHash === 'string' &&
    typeof value.balance === 'number' &&
    Number.isFinite(value.balance) &&
    value.balance >= 0
  );
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    value.authenticated === true
  );
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.status === 'approved' &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    typeof value.createdAt === 'string' &&
    typeof value.reference === 'string'
  );
}

function isTransactionList(value: unknown): value is Transaction[] {
  return Array.isArray(value) && value.every(isTransaction);
}

function readJson<T>(key: StorageKey, guard: ValueGuard<T>, fallback: T): T {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return fallback;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return guard(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function getUser(): User | null {
  return readJson(STORAGE_KEYS.user, isUser, null);
}

function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function getSession(): Session | null {
  return readJson(STORAGE_KEYS.session, isSession, null);
}

function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function updateBalance(newBalance: number): User | null {
  const user = getUser();

  if (!user) {
    return null;
  }

  const updatedUser = { ...user, balance: newBalance };
  saveUser(updatedUser);

  return updatedUser;
}

function getTransactions(): Transaction[] {
  return readJson(STORAGE_KEYS.transactions, isTransactionList, []);
}

function saveTransaction(transaction: Transaction): void {
  const transactions = getTransactions();
  localStorage.setItem(
    STORAGE_KEYS.transactions,
    JSON.stringify([...transactions, transaction]),
  );
}

export const storageService = {
  getUser,
  saveUser,
  getSession,
  saveSession,
  clearSession,
  updateBalance,
  getTransactions,
  saveTransaction,
};
