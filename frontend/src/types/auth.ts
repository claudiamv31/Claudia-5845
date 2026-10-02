export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  balance: number;
}

export type AuthenticatedUser = Omit<User, 'passwordHash'>;

export interface Session {
  userId: User['id'];
  authenticated: true;
}
