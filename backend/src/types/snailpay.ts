export interface SnailPayChargeRequest {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  fullName: string;
  amount: number;
  payerId: string;
  payerEmail: string;
}

export type SnailPayStatus = 'approved' | 'rejected' | 'error';

export type SnailPayStatusDetail =
  | 'approved'
  | 'card_declined'
  | 'validation_error'
  | 'internal_error';

export interface SnailPayChargeResponse {
  id: string;
  status: SnailPayStatus;
  status_detail: SnailPayStatusDetail;
  transaction_amount: number;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string;
  payer_email: string;
  card_number: string;
  cvv: string;
}
