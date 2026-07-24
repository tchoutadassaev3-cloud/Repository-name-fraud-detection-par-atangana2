import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

export const useFraudAlarm = (onAlert?: (alert: any) => void) => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const SOCKET_URL = "ws://localhost:8000/ws/alerts";

    const { lastJsonMessage } = useWebSocket(SOCKET_URL, {
        shouldReconnect: () => true,
        reconnectInterval: 3000,
    });

    useEffect(() => {
        if (lastJsonMessage) {
            const msg = lastJsonMessage as any;
            if (msg.type === "FRAUD_ALERT") {
                setAlerts((prev) => [msg, ...prev].slice(0, 50));
                if (onAlert) onAlert(msg);
            }
        }
    }, [lastJsonMessage, onAlert]);

    return { alerts };
};
