import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Zap, Database, Search, Filter, PlayCircle } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import type { ForensicAlert } from '../store/useTelemetryStore';
import { useAlarm } from '../hooks/useAlarm';
import Odometer from '../components/Odometer';
import ForensicDrawer from '../components/ForensicDrawer';
import ModelLab from '../components/ModelLab';

const SupervisorView: React.FC = () => {
    // Initialize Industrial Telemetry Link
    const { status } = useAlarm();

    // Selective Slices from Atomic Store
    const alerts = useTelemetryStore(state => state.alerts);
    const stats = useTelemetryStore(state => state.stats);
    const clearAlerts = useTelemetryStore(state => state.clearAlerts);

    const [selectedAlert, setSelectedAlert] = useState<ForensicAlert | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'high_risk'>('all');

    // Simulation Logic for Batch Testing
    const handleStressTest = async () => {
        // In a real app, this would trigger the backend batch tester
        console.log('[NOC] Initializing Bulk Ingestion Protocol...');
    };

    const filteredAlerts = useMemo(() => {
        return filterMode === 'high_risk'
            ? alerts.filter(a => a.score > 0.8)
            : alerts.slice(0, 50); // Virtualized View Limit
    }, [alerts, filterMode]);

    return (
        <div className="min-h-screen bg-bg-deep text-white flex flex-col">
            {/* Top Protocol Bar */}
            <nav className="h-16 border-b border-white/5 bg-bg-surface flex items-center justify-between px-8 z-30">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent-cyan/20 border border-accent-cyan/40 rounded flex items-center justify-center text-accent-cyan">
                            <Activity size={18} />
                        </div>
                        <h1 className="font-black italic uppercase tracking-tighter text-lg">Forensic NOC</h1>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent-slate tracking-[0.2em]">
                        NODE_SYS: <span className="text-accent-cyan">MASTER_PRIMARY</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'ONLINE' ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' : 'bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' ? 'bg-accent-emerald' : 'bg-accent-crimson animate-pulse'}`} />
                        {status}_LINK
                    </div>
                    <button onClick={clearAlerts} className="text-[10px] font-bold text-accent-slate hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-3 py-1 rounded-md">
                        Clear Terminal
                    </button>
                </div>
            </nav>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                {/* Left Sidebar: Telemetry & Monitoring */}
                <aside className="lg:col-span-3 border-r border-white/5 p-6 space-y-8 overflow-y-auto">
                    <div className="space-y-4">
                        <Odometer value={alerts.length} label="Total Alerts Detected" icon={<ShieldAlert size={24} />} colorClass="text-accent-crimson" />
                        <Odometer value={stats.totalTX} label="Transactions Processed" icon={<Database size={24} />} colorClass="text-accent-cyan" />
                        <Odometer value={parseInt(stats.throughput.split(' ')[0])} label="Current Throughput (tx/s)" icon={<Zap size={24} />} colorClass="text-accent-emerald" />
                    </div>

                    <div className="pt-8 space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-slate">Real-time Performance</h2>
                        <div className="Glass-Card p-4 h-48 flex items-center justify-center">
                            {/* Simulated mini chart */}
                            <div className="flex items-end gap-1 h-32 w-full">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.random() * 100}%` }}
                                        className="flex-1 bg-accent-cyan/20 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-slate">System Ingress</h2>
                        <button
                            onClick={handleStressTest}
                            className="Btn-Forensic w-full group overflow-hidden relative"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <PlayCircle size={16} /> Batch Ingestion Test
                            </span>
                            <div className="absolute inset-0 bg-accent-cyan/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                        </button>
                    </div>
                </aside>

                {/* Center: Monitoring Stream */}
                <section className="lg:col-span-9 bg-bg-deep relative flex flex-col overflow-hidden">
                    {/* Stream Controls */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-bg-surface/50 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setFilterMode('all')}
                                    className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filterMode === 'all' ? 'bg-accent-cyan text-bg-deep' : 'text-accent-slate hover:text-white'}`}
                                >
                                    All Signals
                                </button>
                                <button
                                    onClick={() => setFilterMode('high_risk')}
                                    className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filterMode === 'high_risk' ? 'bg-accent-crimson text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'text-accent-slate hover:text-white'}`}
                                >
                                    High Risk
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-accent-slate">
                            <Search size={18} />
                            <Filter size={18} />
                        </div>
                    </div>

                    {/* Atomic Forensic Stream */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        <AnimatePresence initial={false}>
                            {filteredAlerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                    onClick={() => setSelectedAlert(alert)}
                                    className={`Glass-Card p-4 cursor-pointer hover:bg-white/5 border-l-4 group transition-all ${alert.score > 0.8 ? 'border-accent-crimson Glow-Crimson' : 'border-accent-emerald'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.score > 0.8 ? 'bg-accent-crimson/10 text-accent-crimson' : 'bg-accent-emerald/10 text-accent-emerald'}`}>
                                                {alert.score > 0.8 ? <ShieldAlert size={20} /> : <Zap size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tighter">
                                                    Incident_Node_{alert.tx_id.split('_').pop()}
                                                </p>
                                                <p className="text-[9px] font-mono uppercase text-accent-slate">
                                                    {new Date(alert.timestamp).toLocaleTimeString()} • € {alert.amount.toLocaleString()} • POS: 48.8 / 2.3
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right space-y-1">
                                            <p className={`text-lg font-black italic Mono ${alert.score > 0.8 ? 'text-accent-crimson' : 'text-accent-emerald'}`}>
                                                {(alert.score * 100).toFixed(1)}%
                                            </p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-accent-slate">Risk_Score</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredAlerts.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-accent-slate space-y-4 pt-24 opacity-30">
                                <Activity size={64} className="animate-pulse" />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">Telemetry Stream Silent</p>
                            </div>
                        )}
                    </div>

                    {/* Administrative MLOps Panel (Bottom Fixed) */}
                    <div className="p-8 border-t border-white/5 bg-bg-surface/30 backdrop-blur-xl">
                        <ModelLab />
                    </div>
                </section>
            </main>

            {/* Side Inspeccion Drawer */}
            <AnimatePresence>
                <ForensicDrawer
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                />
            </AnimatePresence>
        </div>
    );
};

export default SupervisorView;
