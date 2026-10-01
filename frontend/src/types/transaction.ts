export interface Transaction {
  id: string;
  status: 'approved';
  amount: number;
  createdAt: string;
  reference: string;
}
