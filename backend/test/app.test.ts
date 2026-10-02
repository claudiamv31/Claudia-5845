import { once } from 'node:events';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

async function withApi<T>(
  run: (server: ReturnType<typeof app.listen>) => Promise<T>,
): Promise<T> {
  const server = app.listen(0);
  await once(server, 'listening');

  try {
    return await run(server);
  } finally {
    server.close();
  }
}

function postCharge(body: Record<string, unknown>) {
  return withApi((server) =>
    request(server).post('/api/snailpay/charge').send(body),
  );
}

describe('GET /api/health', () => {
  it('reports that the API is available', async () => {
    const response = await withApi((server) =>
      request(server).get('/api/health'),
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/snailpay/charge', () => {
  const validPayment = {
    cardNumber: '1234123412341234',
    expirationDate: '12/26',
    cvv: '543',
    fullName: 'Ada Dashboard',
    amount: 500,
    payerId: 'user-1',
    payerEmail: 'ada@example.com',
  };

  it('approves the documented successful card and returns the payment contract', async () => {
    const response = await postCharge(validPayment);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      status: 'approved',
      status_detail: 'approved',
      transaction_amount: 500,
      payer_id: 'user-1',
      payer_email: 'ada@example.com',
      card_number: '1234123412341234',
      cvv: '543',
    });
    expect(response.body).toEqual({
      ...response.body,
      id: expect.any(String),
      date_created: expect.any(String),
      authorization_code: expect.any(String),
      reference: expect.any(String),
    });
  });

  it('rejects a non-positive amount as a validation error', async () => {
    const response = await postCharge({ ...validPayment, amount: 0 });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      status: 'error',
      status_detail: 'validation_error',
      transaction_amount: 0,
      authorization_code: null,
      payer_id: 'user-1',
      payer_email: 'ada@example.com',
      card_number: '1234123412341234',
      cvv: '543',
    });
  });

  it('returns a reproducible declined-card response', async () => {
    const response = await postCharge({
      ...validPayment,
      cardNumber: '4000000000000002',
      amount: 125,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'rejected',
      status_detail: 'card_declined',
      transaction_amount: 125,
      authorization_code: null,
      card_number: '4000000000000002',
    });
  });

  it('returns the documented internal error with HTTP 500', async () => {
    const response = await postCharge({
      ...validPayment,
      cardNumber: '5000000000000000',
      amount: 125,
    });

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      status: 'error',
      status_detail: 'internal_error',
      transaction_amount: 125,
      authorization_code: null,
      card_number: '5000000000000000',
    });
  });

  it('delays the documented timeout card before returning a timeout response', async () => {
    const startedAt = Date.now();

    const response = await postCharge({
      ...validPayment,
      cardNumber: '9999999999999999',
      amount: 125,
    });
    const elapsedMilliseconds = Date.now() - startedAt;

    expect(elapsedMilliseconds).toBeGreaterThanOrEqual(1_900);
    expect(response.status).toBe(504);
    expect(response.body).toMatchObject({
      status: 'error',
      status_detail: 'timeout',
      transaction_amount: 125,
      authorization_code: null,
      card_number: '9999999999999999',
    });
  });

  it.each([
    ['an invalid email', { payerEmail: 'not-an-email' }],
    ['a malformed card number', { cardNumber: '1234' }],
    ['an empty cardholder name', { fullName: '   ' }],
    ['an invalid expiration date', { expirationDate: '2026-12' }],
    ['an invalid CVV', { cvv: '12' }],
    ['an empty payer ID', { payerId: '' }],
  ])('rejects %s', async (_caseName, invalidField) => {
    const response = await postCharge({ ...validPayment, ...invalidField });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.status_detail).toBe('validation_error');
    expect(response.body.authorization_code).toBeNull();
  });

  it.each([
    ['a different card', { cardNumber: '1111222233334444' }],
    ['a different expiration date', { expirationDate: '11/26' }],
    ['a different CVV', { cvv: '123' }],
  ])('declines otherwise valid credentials with %s', async (_caseName, field) => {
    const response = await postCharge({ ...validPayment, ...field });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('rejected');
    expect(response.body.status_detail).toBe('card_declined');
    expect(response.body.authorization_code).toBeNull();
  });
});
