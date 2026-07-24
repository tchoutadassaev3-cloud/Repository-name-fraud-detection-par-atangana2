import { create } from 'zustand';

export interface ForensicAlert {
    id: string;
    tx_id: string;
    score: number;
    amount: number;
    timestamp: string;
    details?: any;
}

interface TelemetryState {
    // Authentication & Identity
    user: { id: string, name: string, role: string } | null;
    setUser: (user: { id: string, name: string, role: string } | null) => void;

    // Real-time Forensic Pool
    alerts: ForensicAlert[];
    addAlerts: (newAlerts: ForensicAlert[]) => void;
    clearAlerts: () => void;

    // WebSocket & Hardware Link Status
    wsStatus: 'CONNECTING' | 'ONLINE' | 'OFFLINE' | 'RETRYING';
    setWsStatus: (status: 'CONNECTING' | 'ONLINE' | 'OFFLINE' | 'RETRYING') => void;

    // MLOps Registry State
    activeModel: string;
    setActiveModel: (id: string) => void;
    models: any[];
    setModels: (models: any[]) => void;

    // Real-time Stats (Atomic Slices)
    stats: {
        totalTX: number;
        fraudCount: number;
        latency: number;
        throughput: string;
    };
    updateStats: (updates: Partial<TelemetryState['stats']>) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),

    alerts: [],
    addAlerts: (newAlerts) => set((state) => ({
        alerts: [...newAlerts, ...state.alerts].slice(0, 5000) // Virtualized buffer pool
    })),
    clearAlerts: () => set({ alerts: [] }),

    wsStatus: 'OFFLINE',
    setWsStatus: (wsStatus) => set({ wsStatus }),

    activeModel: 'NEXUS_BAYES_V4',
    setActiveModel: (activeModel) => set({ activeModel }),
    models: [],
    setModels: (models) => set({ models }),

    stats: {
        totalTX: 0,
        fraudCount: 0,
        latency: 1.2,
        throughput: '0 tx/s'
    },
    updateStats: (updates) => set((state) => ({
        stats: { ...state.stats, ...updates }
    }))
}));
