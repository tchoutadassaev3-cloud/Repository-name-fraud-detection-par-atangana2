import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import type { ForensicAlert } from '../store/useTelemetryStore';

const WS_URL = 'ws://localhost:8000/ws/alerts';
const MAX_BACKOFF = 30000;

export const useAlarm = () => {
    const { addAlerts, setWsStatus, wsStatus } = useTelemetryStore();
    const socketRef = useRef<WebSocket | null>(null);
    const backoffRef = useRef(1000);

    // Ring Buffer for Backpressure management
    const bufferRef = useRef<ForensicAlert[]>([]);
    const requestRef = useRef<number | null>(null);

    // Audio Context for Forensic Beeps
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    };

    const playBeep = () => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square'; // Technical/Industrial texture
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    };

    // rAF Batcher: Flush buffer at 60Hz
    const flushBuffer = () => {
        if (bufferRef.current.length > 0) {
            const batch = [...bufferRef.current];
            bufferRef.current = [];
            addAlerts(batch);
            playBeep();
        }
        requestRef.current = requestAnimationFrame(flushBuffer);
    };

    const connect = () => {
        console.log('[NOC] Initializing forensic telemetry link...');
        setWsStatus('CONNECTING');

        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('[NOC] Telemetry ONLINE');
            setWsStatus('ONLINE');
            backoffRef.current = 1000;
            initAudio();
            requestRef.current = requestAnimationFrame(flushBuffer);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'FRAUD_ALARM') {
                    const alert: ForensicAlert = {
                        id: `AL_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        tx_id: data.tx_id,
                        score: data.score,
                        amount: data.amount,
                        timestamp: new Date().toISOString(),
                        details: data
                    };
                    // Buffer the incoming signal (Backpressure control)
                    bufferRef.current.push(alert);
                }
            } catch (e) {
                console.error('[NOC] Signal Malformed', e);
            }
        };

        ws.onclose = () => {
            setWsStatus('OFFLINE');
            if (requestRef.current) cancelAnimationFrame(requestRef.current);

            const nextBackoff = Math.min(backoffRef.current * 1.5, MAX_BACKOFF);
            backoffRef.current = nextBackoff;
            console.log(`[NOC] Link Lost. Reconnecting in ${Math.round(nextBackoff / 1000)}s...`);
            setWsStatus('RETRYING');
            setTimeout(connect, nextBackoff);
        };
    };

    useEffect(() => {
        connect();

        return () => {
            // Systematic Cleanup (Garbage Collection)
            console.log('[NOC] Decommissioning Telemetry Link');
            if (socketRef.current) socketRef.current.close();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    return { status: wsStatus };
};
