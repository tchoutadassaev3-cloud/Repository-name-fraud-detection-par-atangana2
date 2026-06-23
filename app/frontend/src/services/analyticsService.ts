import api from './api';

export interface DashboardData {
  total_transactions: number;
  fraud_alerts: number;
  high_risk_transactions: number;
  accepted_transactions: number;
  fraud_rate: number;
  total_amount?: number;
  fraud_amount?: number;
  blocked_transactions?: number;
  avg_fraud_score?: number;
  recent_alerts?: number;
}

export interface FraudTrend {
  date: string;
  fraud_count: number;
  total_count: number;
  fraud_rate: number;
}

export interface RealtimeData {
  active_alerts: number;
  transactions_per_minute: number;
  fraud_detected_today: number;
  system_status: string;
  recent_events?: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: string;
  }>;
}

export const analyticsService = {
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/analytics/dashboard');
    return response.data;
  },

  async getFraudTrends(): Promise<FraudTrend[]> {
    const response = await api.get<FraudTrend[] | { trends: FraudTrend[] }>('/analytics/fraud-trends');
    const data = response.data;
    return Array.isArray(data) ? data : data.trends || [];
  },

  async getRealtime(): Promise<RealtimeData> {
    const response = await api.get<RealtimeData>('/analytics/realtime');
    return response.data;
  },
};
