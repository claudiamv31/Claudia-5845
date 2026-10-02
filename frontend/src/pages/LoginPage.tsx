import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
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
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const result = await login({ email, password });

      if (!result.ok) {
        setCredentialError('Email or password is incorrect.');
        return;
      }

      navigate('/dashboard', { replace: true });
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

        {user ? (
          <div className="success-message" role="status">
            <strong>Welcome back, {user.fullName}</strong>
            <p>Your session is active.</p>
          </div>
        ) : (
          <form
            className="registration-form"
            onSubmit={handleSubmit}
            noValidate
          >
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
