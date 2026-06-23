import api from './api';

export interface PredictionInput {
  amt: number;
  cc_num: string;
  merchant: string;
  category: string;
  city_pop: number;
  job: string;
  unix_time: number;
  merch_lat: number;
  merch_long: number;
  lat: number;
  long: number;
}

export interface PredictionResult {
  is_fraud: boolean;
  fraud_probability: number;
  risk_level: string;
  decision: string;
  status: string;
  transaction_id?: string;
  explanation?: string;
  features?: Record<string, number>;
}

export const predictService = {
  async predict(input: PredictionInput): Promise<PredictionResult> {
    const response = await api.post<PredictionResult>('/predict', input);
    return response.data;
  },
};
