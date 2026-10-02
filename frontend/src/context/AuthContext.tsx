import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authService,
  type LoginInput,
  type LoginResult,
  type RegistrationInput,
  type RegistrationResult,
} from '../services/authService';
import type { AuthenticatedUser } from '../types/auth';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  register: (input: RegistrationInput) => Promise<RegistrationResult>;
  login: (input: LoginInput) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() =>
    authService.getAuthenticatedUser(),
  );

  const register = useCallback(async (input: RegistrationInput) => {
    const result = await authService.register(input);

    if (result.ok) {
      setUser(null);
    }

    return result;
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await authService.login(input);

    if (result.ok) {
      setUser(result.user);
    }

    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      register,
      login,
      logout,
    }),
    [login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
