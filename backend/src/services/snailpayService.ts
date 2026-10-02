import { randomUUID } from 'node:crypto';
import type {
  SnailPayChargeRequest,
  SnailPayChargeResponse,
  SnailPayStatus,
  SnailPayStatusDetail,
} from '../types/snailpay.js';

export interface SnailPayChargeResult {
  httpStatus: number;
  body: SnailPayChargeResponse;
}

const TIMEOUT_DELAY_MS = 2_000;
const INTERNAL_ERROR_CARD_NUMBER = '5000000000000000';
const TIMEOUT_CARD_NUMBER = '9999999999999999';
const REJECTED_CARD_NUMBER = '4000000000000002';
const TEST_CARD_PLACEHOLDER = '0000000000000000';
const TEST_CVV = '543';
const TEST_CVV_PLACEHOLDER = '000';
const APPROVED_PAYMENT_METHOD = {
  cardNumber: '1234123412341234',
  expirationDate: '12/26',
  cvv: TEST_CVV,
} as const;
const DOCUMENTED_CARD_NUMBERS = new Set([
  APPROVED_PAYMENT_METHOD.cardNumber,
  REJECTED_CARD_NUMBER,
  INTERNAL_ERROR_CARD_NUMBER,
  TIMEOUT_CARD_NUMBER,
]);

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePayment(value: unknown): SnailPayChargeRequest {
  const payment = isRecord(value) ? value : {};

  return {
    cardNumber:
      typeof payment.cardNumber === 'string' ? payment.cardNumber : '',
    expirationDate:
      typeof payment.expirationDate === 'string' ? payment.expirationDate : '',
    cvv: typeof payment.cvv === 'string' ? payment.cvv : '',
    fullName: typeof payment.fullName === 'string' ? payment.fullName : '',
    amount:
      typeof payment.amount === 'number' && Number.isFinite(payment.amount)
        ? payment.amount
        : 0,
    payerId: typeof payment.payerId === 'string' ? payment.payerId : '',
    payerEmail:
      typeof payment.payerEmail === 'string' ? payment.payerEmail : '',
  };
}

function isValidPayment(payment: SnailPayChargeRequest): boolean {
  return (
    /^\d{16}$/.test(payment.cardNumber) &&
    /^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expirationDate) &&
    /^\d{3}$/.test(payment.cvv) &&
    payment.fullName.trim().length > 0 &&
    payment.amount > 0 &&
    payment.payerId.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.payerEmail)
  );
}

function createResponse(
  payment: SnailPayChargeRequest,
  status: SnailPayStatus,
  statusDetail: SnailPayStatusDetail,
): SnailPayChargeResponse {
  const paymentId = randomUUID();

  return {
    id: paymentId,
    status,
    status_detail: statusDetail,
    transaction_amount: payment.amount,
    date_created: new Date().toISOString(),
    authorization_code:
      status === 'approved' ? paymentId.slice(0, 8).toUpperCase() : null,
    reference: `snailpay-${paymentId}`,
    payer_id: payment.payerId,
    payer_email: payment.payerEmail,
    card_number: DOCUMENTED_CARD_NUMBERS.has(payment.cardNumber)
      ? payment.cardNumber
      : TEST_CARD_PLACEHOLDER,
    cvv: payment.cvv === TEST_CVV ? payment.cvv : TEST_CVV_PLACEHOLDER,
  };
}

export async function charge(
  rawPayment: unknown,
): Promise<SnailPayChargeResult> {
  const payment = normalizePayment(rawPayment);

  if (!isValidPayment(payment)) {
    return {
      httpStatus: 400,
      body: createResponse(payment, 'error', 'validation_error'),
    };
  }

  if (payment.cardNumber === INTERNAL_ERROR_CARD_NUMBER) {
    return {
      httpStatus: 500,
      body: createResponse(payment, 'error', 'internal_error'),
    };
  }

  if (payment.cardNumber === TIMEOUT_CARD_NUMBER) {
    await wait(TIMEOUT_DELAY_MS);

    return {
      httpStatus: 504,
      body: createResponse(payment, 'error', 'timeout'),
    };
  }

  const isApproved =
    payment.cardNumber === APPROVED_PAYMENT_METHOD.cardNumber &&
    payment.expirationDate === APPROVED_PAYMENT_METHOD.expirationDate &&
    payment.cvv === APPROVED_PAYMENT_METHOD.cvv;

  return isApproved
    ? {
        httpStatus: 201,
        body: createResponse(payment, 'approved', 'approved'),
      }
    : {
        httpStatus: 200,
        body: createResponse(payment, 'rejected', 'card_declined'),
      };
}
