import { useState, type FormEvent } from 'react';
import { FormField } from '../components/FormField';
import { authService } from '../services/authService';
import { isValidEmail } from '../utils/validation';

interface RegistrationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
}

function validateRegistration(
  fullName: string,
  email: string,
  password: string,
  passwordConfirmation: string,
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (!fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!passwordConfirmation) {
    errors.passwordConfirmation = 'Please confirm your password.';
  } else if (password !== passwordConfirmation) {
    errors.passwordConfirmation = 'Passwords do not match.';
  }

  return errors;
}

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateRegistration(
      fullName,
      email,
      password,
      passwordConfirmation,
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const result = await authService.register({ fullName, email, password });

      if (!result.ok) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          email: 'This email is already registered.',
        }));
        return;
      }

      setIsRegistered(true);
    } catch {
      setSubmissionError(
        'We could not create your account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="register-title">
        <span className="eyebrow">Snail Racing</span>
        <h1 id="register-title">Create your account</h1>
        <p>Start with a secure local profile and a $0.00 balance.</p>

        {isRegistered ? (
          <div className="success-message" role="status">
            <strong>Account created</strong>
            <p>Your local profile is ready.</p>
            <a className="text-link" href="/login">
              Continue to sign in
            </a>
          </div>
        ) : (
          <form className="registration-form" onSubmit={handleSubmit} noValidate>
            <FormField
              id="full-name"
              label="Full name"
              name="fullName"
              autoComplete="name"
              error={errors.fullName}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />

            <FormField
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              error={errors.email}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <FormField
              id="password"
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              error={errors.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <FormField
              id="password-confirmation"
              label="Confirm password"
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              error={errors.passwordConfirmation}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
            />

            {submissionError ? (
              <p className="form-error" role="alert">
                {submissionError}
              </p>
            ) : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="auth-footer">
              Already registered?{' '}
              <a className="text-link" href="/login">
                Sign in
              </a>
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
