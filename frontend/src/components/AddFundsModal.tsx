import { useEffect, useRef, useState, type FormEvent } from 'react';
import { snailPayService, SnailPayError } from '../services/snailPayService';
import type { AuthenticatedUser } from '../types/auth';
import type {
  Transaction,
  TransactionApplicationResult,
} from '../types/transaction';
import { formatUsd } from '../utils/currency';
import { FormField } from './FormField';

interface AddFundsModalProps {
  user: AuthenticatedUser;
  onClose: () => void;
  onApproved: (transaction: Transaction) => TransactionApplicationResult;
}

interface PaymentForm {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  fullName: string;
  amount: string;
}

type PaymentField = keyof PaymentForm;
type PaymentErrors = Partial<Record<PaymentField, string>>;

interface PaymentFeedback {
  title: string;
  message: string;
  detail: string;
  tone: 'success' | 'warning' | 'error';
}

function digitsOnly(value: string, maximumLength: number): string {
  return value.replace(/\D/g, '').slice(0, maximumLength);
}

function formatCardNumber(value: string): string {
  return digitsOnly(value, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiration(value: string): string {
  const digits = digitsOnly(value, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function validatePayment(form: PaymentForm): PaymentErrors {
  const errors: PaymentErrors = {};

  if (digitsOnly(form.cardNumber, 16).length !== 16) {
    errors.cardNumber = 'Enter a 16-digit card number.';
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expirationDate)) {
    errors.expirationDate = 'Use the MM/YY format.';
  }

  if (!/^\d{3}$/.test(form.cvv)) {
    errors.cvv = 'Enter the 3-digit CVV.';
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Enter the cardholder name.';
  }

  if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
    errors.amount = 'Enter an amount greater than zero.';
  }

  return errors;
}

function feedbackFor(error: unknown): PaymentFeedback {
  const code = error instanceof SnailPayError ? error.code : 'NETWORK_ERROR';

  if (code === 'CARD_DECLINED') {
    return {
      title: 'Payment declined',
      message: 'Your card could not be processed.',
      detail: 'No changes were made to your balance.',
      tone: 'error',
    };
  }

  if (code === 'TIMEOUT') {
    return {
      title: 'Payment taking too long',
      message: 'The payment service did not respond in time.',
      detail: 'No changes were made to your balance.',
      tone: 'error',
    };
  }

  if (code === 'VALIDATION_ERROR') {
    return {
      title: 'Check your payment details',
      message: 'SnailPay could not validate this payment.',
      detail: 'No changes were made to your balance.',
      tone: 'error',
    };
  }

  if (code === 'NETWORK_ERROR') {
    return {
      title: 'Unable to reach SnailPay',
      message: 'Check your connection and try again.',
      detail: 'Your balance was not modified.',
      tone: 'error',
    };
  }

  return {
    title: 'Something went wrong',
    message: 'SnailPay is temporarily unavailable.',
    detail: 'Your balance was not modified.',
    tone: 'error',
  };
}

export function AddFundsModal({
  user,
  onClose,
  onApproved,
}: AddFundsModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const submissionInProgressRef = useRef(false);
  const [form, setForm] = useState<PaymentForm>({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    fullName: user.fullName,
    amount: '',
  });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<PaymentFeedback | null>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleModalKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled])',
        ) ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isSubmitting, onClose]);

  useEffect(() => {
    if (feedback && feedback.tone !== 'error') {
      doneButtonRef.current?.focus();
    }
  }, [feedback]);

  function updateField(field: PaymentField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionInProgressRef.current) {
      return;
    }

    const validationErrors = validatePayment(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    submissionInProgressRef.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payment = await snailPayService.charge({
        cardNumber: digitsOnly(form.cardNumber, 16),
        expirationDate: form.expirationDate,
        cvv: form.cvv,
        fullName: form.fullName.trim(),
        amount: Number(form.amount),
        payerId: user.id,
        payerEmail: user.email,
      });
      const transaction: Transaction = {
        id: payment.id,
        status: 'approved',
        amount: payment.transaction_amount,
        createdAt: payment.date_created,
        reference: payment.reference,
        cardNumber: payment.card_number,
        cvv: payment.cvv,
      };

      const applicationResult = onApproved(transaction);

      if (applicationResult === 'persistence_error') {
        setFeedback({
          title: 'Balance update failed',
          message: 'The payment was approved but could not be saved locally.',
          detail: 'Do not submit it again. Reload the page before continuing.',
          tone: 'warning',
        });
        return;
      }

      if (applicationResult === 'duplicate') {
        setFeedback({
          title: 'Payment already applied',
          message: 'This payment was already included in your balance.',
          detail: 'No duplicate funds were added.',
          tone: 'warning',
        });
        return;
      }

      setFeedback({
        title: 'Payment approved',
        message: `${formatUsd(transaction.amount)} was added to your balance.`,
        detail: 'Your new balance is available immediately.',
        tone: 'success',
      });
    } catch (error) {
      setFeedback(feedbackFor(error));
    } finally {
      submissionInProgressRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        ref={dialogRef}
        className="payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-funds-title"
      >
        <div className="payment-modal-heading">
          <div>
            <span className="eyebrow">Secure top-up</span>
            <h2 id="add-funds-title">Add funds</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close add funds"
          >
            ×
          </button>
        </div>

        <p className="payment-security-note">
          Test mode only. Use the documented fictitious card numbers and never
          enter real payment information.
        </p>

        {feedback && feedback.tone !== 'error' ? (
          <div
            className={`payment-result payment-result-${feedback.tone}`}
            role="status"
          >
            <strong>{feedback.title}</strong>
            <p>{feedback.message}</p>
            <small>{feedback.detail}</small>
            <button ref={doneButtonRef} type="button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="payment-form" onSubmit={handleSubmit} noValidate>
            <FormField
              ref={firstInputRef}
              id="card-number"
              label="Card number"
              value={form.cardNumber}
              onChange={(event) =>
                updateField('cardNumber', formatCardNumber(event.target.value))
              }
              error={errors.cardNumber}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              disabled={isSubmitting}
            />

            <div className="payment-form-row">
              <FormField
                id="expiration"
                label="Expiration"
                value={form.expirationDate}
                onChange={(event) =>
                  updateField(
                    'expirationDate',
                    formatExpiration(event.target.value),
                  )
                }
                error={errors.expirationDate}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                disabled={isSubmitting}
              />
              <FormField
                id="cvv"
                label="CVV"
                value={form.cvv}
                onChange={(event) =>
                  updateField('cvv', digitsOnly(event.target.value, 3))
                }
                error={errors.cvv}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                disabled={isSubmitting}
              />
            </div>

            <FormField
              id="cardholder-name"
              label="Cardholder name"
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              error={errors.fullName}
              autoComplete="cc-name"
              disabled={isSubmitting}
            />

            <FormField
              id="amount"
              label="Amount"
              value={form.amount}
              onChange={(event) => updateField('amount', event.target.value)}
              error={errors.amount}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="500.00"
              disabled={isSubmitting}
            />

            {feedback ? (
              <div className="payment-result payment-result-error" role="alert">
                <strong>{feedback.title}</strong>
                <p>{feedback.message}</p>
                <small>{feedback.detail}</small>
              </div>
            ) : null}

            <div className="payment-actions">
              <button
                className="button-secondary"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Add funds'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
