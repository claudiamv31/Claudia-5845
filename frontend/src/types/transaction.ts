export interface Transaction {
  id: string;
  status: 'approved';
  amount: number;
  createdAt: string;
  reference: string;
  cardNumber: string;
  cvv: string;
}

export type TransactionApplicationResult =
  | 'applied'
  | 'duplicate'
  | 'persistence_error';
