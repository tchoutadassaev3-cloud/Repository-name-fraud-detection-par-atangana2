import api from './api';

export interface Alert {
  id: string;
  alert_id?: string;
  type: string;
  severity: string;
  message: string;
  transaction_id?: string;
  amount?: number;
  merchant?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  critical_count?: number;
  unresolved_count?: number;
}

export const alertsService = {
  async getAlerts(params?: {
    severity?: string;
    status?: string;
    limit?: number;
  }): Promise<AlertsResponse> {
    const response = await api.get<AlertsResponse>('/alerts', { params });
    return response.data;
  },
};
