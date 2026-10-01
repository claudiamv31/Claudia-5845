import { useState, type FormEvent } from 'react';
import { FormField } from '../components/FormField';
import { authService } from '../services/authService';
import type { User } from '../types/auth';
import { isValidEmail } from '../utils/validation';

interface LoginErrors {
  email?: string;
  password?: string;
}

function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [credentialError, setCredentialError] = useState<string | null>(null);

  function handleEmailChange(value: string) {
    setEmail(value);
    setErrors((currentErrors) => ({ ...currentErrors, email: undefined }));
    setCredentialError(null);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
    setCredentialError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateLogin(email, password);
    setErrors(validationErrors);
    setCredentialError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.login({ email, password });

      if (!result.ok) {
        setCredentialError('Email or password is incorrect.');
        return;
      }

      setAuthenticatedUser(result.user);
    } catch {
      setCredentialError('We could not sign you in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="login-title">
        <span className="eyebrow">Snail Racing</span>
        <h1 id="login-title">Welcome back</h1>
        <p>Sign in to continue to your racing dashboard.</p>

        {authenticatedUser ? (
          <div className="success-message" role="status">
            <strong>Welcome back, {authenticatedUser.fullName}</strong>
            <p>Your credentials were verified successfully.</p>
          </div>
        ) : (
          <form className="registration-form" onSubmit={handleSubmit} noValidate>
            <FormField
              id="login-email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              descriptionId={credentialError ? 'login-error' : undefined}
              error={errors.email}
              invalid={Boolean(errors.email || credentialError)}
              value={email}
              onChange={(event) => handleEmailChange(event.target.value)}
              required
            />

            <FormField
              id="login-password"
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              descriptionId={credentialError ? 'login-error' : undefined}
              error={errors.password}
              invalid={Boolean(errors.password || credentialError)}
              value={password}
              onChange={(event) => handlePasswordChange(event.target.value)}
              required
            />

            {credentialError ? (
              <p id="login-error" className="form-error" role="alert">
                {credentialError}
              </p>
            ) : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="auth-footer">
              New to Snail Racing?{' '}
              <a className="text-link" href="/register">
                Create an account
              </a>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
