import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants';

export interface WSMessage {
  id: string;
  type: string;
  severity: string;
  message: string;
  transaction_id?: string;
  amount?: number;
  merchant?: string;
  timestamp: string;
  fraud_score?: number;
}

interface UseWebSocketReturn {
  messages: WSMessage[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  clearMessages: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setConnectionStatus('connecting');
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message: WSMessage = {
            id: data.id || crypto.randomUUID(),
            type: data.type || 'alert',
            severity: data.severity || 'medium',
            message: data.message || 'Fraud alert detected',
            transaction_id: data.transaction_id,
            amount: data.amount,
            merchant: data.merchant,
            timestamp: data.timestamp || new Date().toISOString(),
            fraud_score: data.fraud_score,
          };
          setMessages((prev) => [message, ...prev].slice(0, 100));
        } catch {
          // non-JSON message, skip
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    clearMessages,
  };
}
