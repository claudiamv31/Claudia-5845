import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { authService } from './services/authService';
import { storageService } from './services/storageService';

const testUser = {
  fullName: 'Ada Caracol',
  email: 'ada@example.com',
  password: 'Caracol123',
};

async function renderAuthenticatedDashboard(): Promise<void> {
  await authService.register(testUser);
  await authService.login({
    email: testUser.email,
    password: testUser.password,
  });

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

function openAndCompletePaymentForm(cardNumber: string, amount = '500') {
  fireEvent.click(screen.getByRole('button', { name: /^add funds$/i }));
  const dialog = screen.getByRole('dialog', { name: /add funds/i });

  fireEvent.change(within(dialog).getByLabelText(/card number/i), {
    target: { value: cardNumber },
  });
  fireEvent.change(within(dialog).getByLabelText(/^expiration$/i), {
    target: { value: '1226' },
  });
  fireEvent.change(within(dialog).getByLabelText(/^cvv$/i), {
    target: { value: '543' },
  });
  fireEvent.change(within(dialog).getByLabelText(/^amount$/i), {
    target: { value: amount },
  });

  return dialog;
}

function submitPayment(dialog: HTMLElement) {
  fireEvent.click(
    within(dialog).getByRole('button', { name: /^add funds$/i }),
  );
}

describe('dashboard route', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows the authenticated user and current balance', async () => {
    await renderAuthenticatedDashboard();

    expect(
      screen.getByRole('heading', { name: /welcome, ada caracol/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add funds/i }),
    ).toBeEnabled();
  });

  it('adds an approved payment to the visible and persisted balance', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'payment-1',
        status: 'approved',
        status_detail: 'approved',
        transaction_amount: 500,
        date_created: '2026-10-02T18:00:00.000Z',
        authorization_code: 'AUTH-001',
        reference: 'snailpay-payment-1',
        payer_id: 'user-id',
        payer_email: testUser.email,
        card_number: '1234123412341234',
        cvv: '543',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await renderAuthenticatedDashboard();

    const dialog = openAndCompletePaymentForm('1234123412341234');
    submitPayment(dialog);

    expect(await within(dialog).findByText(/payment approved/i)).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/\$500\.00 was added to your balance/i),
    ).toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(500);
    expect(storageService.getTransactions()).toEqual([
      {
        id: 'payment-1',
        status: 'approved',
        amount: 500,
        createdAt: '2026-10-02T18:00:00.000Z',
        reference: 'snailpay-payment-1',
        cardNumber: '1234123412341234',
        cvv: '543',
      },
    ]);
  });

  it('keeps the balance unchanged when SnailPay declines the card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'payment-declined',
          status: 'rejected',
          status_detail: 'card_declined',
          transaction_amount: 500,
          date_created: '2026-10-02T18:00:00.000Z',
          authorization_code: null,
          reference: 'snailpay-payment-declined',
          payer_id: 'user-id',
          payer_email: testUser.email,
          card_number: '4000000000000002',
          cvv: '543',
        }),
      }),
    );
    await renderAuthenticatedDashboard();

    const dialog = openAndCompletePaymentForm('4000000000000002');
    submitPayment(dialog);

    expect(await within(dialog).findByText(/payment declined/i)).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('keeps the balance unchanged when SnailPay returns a system error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          id: 'payment-error',
          status: 'error',
          status_detail: 'internal_error',
          transaction_amount: 500,
          date_created: '2026-10-02T18:00:00.000Z',
          authorization_code: null,
          reference: 'snailpay-payment-error',
          payer_id: 'user-id',
          payer_email: testUser.email,
          card_number: '5000000000000000',
          cvv: '543',
        }),
      }),
    );
    await renderAuthenticatedDashboard();

    const dialog = openAndCompletePaymentForm('5000000000000000');
    submitPayment(dialog);

    expect(await within(dialog).findByText(/something went wrong/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('blocks duplicate submissions and preserves the balance on timeout', async () => {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Request aborted', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal(
      'fetch',
      fetchMock,
    );
    await renderAuthenticatedDashboard();
    vi.useFakeTimers();

    const dialog = openAndCompletePaymentForm('9999999999999999');
    const form = dialog.querySelector('form');

    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(
      within(dialog).getByRole('button', { name: /processing/i }),
    ).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(within(dialog).getByText(/payment taking too long/i)).toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('distinguishes a network failure without modifying the balance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await renderAuthenticatedDashboard();

    const dialog = openAndCompletePaymentForm('1234123412341234');
    submitPayment(dialog);

    expect(
      await within(dialog).findByText(/unable to reach snailpay/i),
    ).toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('treats an invalid HTTP response as a system error, not a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      }),
    );
    await renderAuthenticatedDashboard();

    const dialog = openAndCompletePaymentForm('1234123412341234');
    submitPayment(dialog);

    expect(
      await within(dialog).findByText(/something went wrong/i),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/unable to reach/i)).not.toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
  });

  it('does not report success when the approved balance cannot be persisted', async () => {
    const originalSetItem = Storage.prototype.setItem;
    let transactionWriteFailed = false;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'payment-storage-error',
          status: 'approved',
          status_detail: 'approved',
          transaction_amount: 500,
          date_created: '2026-10-02T18:00:00.000Z',
          authorization_code: 'AUTH-002',
          reference: 'snailpay-storage-error',
          payer_id: 'user-id',
          payer_email: testUser.email,
          card_number: '1234123412341234',
          cvv: '543',
        }),
      }),
    );
    await renderAuthenticatedDashboard();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === 'snail-racing:transactions' && !transactionWriteFailed) {
        transactionWriteFailed = true;
        throw new Error('Storage unavailable');
      }

      originalSetItem.call(this, key, value);
    });

    const dialog = openAndCompletePaymentForm('1234123412341234');
    submitPayment(dialog);

    expect(
      await within(dialog).findByText(/balance update failed/i),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/payment approved/i)).not.toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('rejects an approved response with invalid stored card details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'payment-invalid-card-data',
          status: 'approved',
          status_detail: 'approved',
          transaction_amount: 500,
          date_created: '2026-10-02T18:00:00.000Z',
          authorization_code: 'AUTH-003',
          reference: 'snailpay-invalid-card-data',
          payer_id: 'user-id',
          payer_email: testUser.email,
          card_number: '1234',
          cvv: '9',
        }),
      }),
    );
    await renderAuthenticatedDashboard();

    const dialog = openAndCompletePaymentForm('1234123412341234');
    submitPayment(dialog);

    expect(
      await within(dialog).findByText(/something went wrong/i),
    ).toBeInTheDocument();
    expect(storageService.getUser()?.balance).toBe(0);
    expect(storageService.getTransactions()).toEqual([]);
  });

  it('describes won and lost bets in the performance chart', async () => {
    await renderAuthenticatedDashboard();

    expect(
      screen.getByRole('img', {
        name: /bet outcomes: 14 won and 6 lost/i,
      }),
    ).toBeInTheDocument();
  });

  it('describes the victory total for every snail', async () => {
    await renderAuthenticatedDashboard();

    expect(
      screen.getByRole('img', {
        name: /snail victories: turbo 2, shelly 1, rocket 1, dash 0, peanut 1, flash 1/i,
      }),
    ).toBeInTheDocument();
  });

  it('returns to login after logout without deleting the account', async () => {
    await renderAuthenticatedDashboard();
    const registeredUser = storageService.getUser();

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(storageService.getSession()).toBeNull();
    expect(storageService.getUser()).toEqual(registeredUser);
  });

  it('opens the dashboard after a valid login', async () => {
    await authService.register(testUser);
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: testUser.email },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: testUser.password },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByRole('heading', { name: /welcome, ada caracol/i }),
    ).toBeInTheDocument();
  });
});
