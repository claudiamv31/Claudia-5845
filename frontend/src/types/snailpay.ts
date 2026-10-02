export interface SnailPayChargeRequest {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  fullName: string;
  amount: number;
  payerId: string;
  payerEmail: string;
}

export interface SnailPayChargeResponse {
  id: string;
  status: 'approved' | 'rejected' | 'error';
  status_detail:
    | 'approved'
    | 'card_declined'
    | 'validation_error'
    | 'internal_error'
    | 'timeout';
  transaction_amount: number;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string;
  payer_email: string;
  card_number: string;
  cvv: string;
}

export type SnailPayErrorCode =
  | 'VALIDATION_ERROR'
  | 'CARD_DECLINED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';
