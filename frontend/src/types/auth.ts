export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  balance: number;
}

export interface Session {
  userId: User['id'];
  authenticated: true;
}
