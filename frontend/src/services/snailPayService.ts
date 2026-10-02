import type {
  SnailPayChargeRequest,
  SnailPayChargeResponse,
  SnailPayErrorCode,
} from '../types/snailpay';

const REQUEST_TIMEOUT_MS = 1_000;

export class SnailPayError extends Error {
  constructor(readonly code: SnailPayErrorCode) {
    super(code);
    this.name = 'SnailPayError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isChargeResponse(value: unknown): value is SnailPayChargeResponse {
  const validStatuses = ['approved', 'rejected', 'error'];
  const validStatusDetails = [
    'approved',
    'card_declined',
    'validation_error',
    'internal_error',
    'timeout',
  ];

  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    validStatuses.includes(String(value.status)) &&
    validStatusDetails.includes(String(value.status_detail)) &&
    typeof value.transaction_amount === 'number' &&
    typeof value.date_created === 'string' &&
    (typeof value.authorization_code === 'string' ||
      value.authorization_code === null) &&
    typeof value.reference === 'string' &&
    typeof value.payer_id === 'string' &&
    typeof value.payer_email === 'string' &&
    /^\d{16}$/.test(String(value.card_number)) &&
    /^\d{3}$/.test(String(value.cvv))
  );
}

function errorCodeFor(response: SnailPayChargeResponse): SnailPayErrorCode {
  switch (response.status_detail) {
    case 'validation_error':
      return 'VALIDATION_ERROR';
    case 'card_declined':
      return 'CARD_DECLINED';
    case 'timeout':
      return 'TIMEOUT';
    default:
      return 'INTERNAL_ERROR';
  }
}

async function charge(
  payment: SnailPayChargeRequest,
): Promise<SnailPayChargeResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch('/api/snailpay/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
      signal: controller.signal,
    });
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      throw new SnailPayError('INTERNAL_ERROR');
    }

    if (!isChargeResponse(body)) {
      throw new SnailPayError('INTERNAL_ERROR');
    }

    if (
      !response.ok ||
      body.status !== 'approved' ||
      body.status_detail !== 'approved'
    ) {
      throw new SnailPayError(errorCodeFor(body));
    }

    return body;
  } catch (error) {
    if (error instanceof SnailPayError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SnailPayError('TIMEOUT');
    }

    throw new SnailPayError('NETWORK_ERROR');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const snailPayService = { charge };
