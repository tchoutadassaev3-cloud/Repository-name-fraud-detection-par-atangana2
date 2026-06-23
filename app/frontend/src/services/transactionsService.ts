import api from './api';

export interface Transaction {
  id: string;
  transaction_id?: string;
  amount: number;
  merchant: string;
  category: string;
  fraud_score: number;
  risk_level: string;
  status: string;
  date: string;
  created_at?: string;
  card_number?: string;
  city?: string;
  job?: string;
  lat?: number;
  long?: number;
  merch_lat?: number;
  merch_long?: number;
  is_fraud?: boolean;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const transactionsService = {
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    risk_level?: string;
  }): Promise<TransactionsResponse> {
    const response = await api.get<TransactionsResponse>('/transactions', { params });
    return response.data;
  },
};
