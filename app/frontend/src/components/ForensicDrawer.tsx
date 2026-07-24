import React from 'react';
import { motion } from 'framer-motion';
import { X, Fingerprint, Gauge, Database, BarChart3, AlertCircle } from 'lucide-react';
import type { ForensicAlert } from '../store/useTelemetryStore';

interface Props {
    alert: ForensicAlert | null;
    onClose: () => void;
}

const ForensicDrawer: React.FC<Props> = ({ alert, onClose }) => {
    if (!alert) return null;

    // Simulate SHAP factors (In a real app, these come from backend metadata)
    const shapFactors = [
        { name: 'Amount Velocity', value: 0.85, polarity: 'pos' },
        { name: 'Geospatial Jump', value: -0.42, polarity: 'neg' },
        { name: 'Category Frequency', value: 0.64, polarity: 'pos' },
        { name: 'Unix Time Anomaly', value: 0.12, polarity: 'pos' },
        { name: 'Merchant Affinity', value: -0.15, polarity: 'neg' },
        { name: 'City Population', value: 0.05, polarity: 'pos' },
    ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const sigma = 0.25; // Simulated Uncertainty
    const mu = alert.score;

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[450px] bg-bg-surface border-l border-white/10 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-50 overflow-y-auto p-8 space-y-12"
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-accent-crimson border-l-2 border-accent-crimson pl-4">
                    <Fingerprint size={24} />
                    <h2 className="text-xl font-black uppercase tracking-tighter">Forensic Audit</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-accent-slate">
                    <X size={24} />
                </button>
            </div>

            {/* Transaction Summary Card */}
            <div className="Glass-Card p-6 space-y-4">
                <p className="text-[10px] font-bold text-accent-slate uppercase tracking-widest flex items-center gap-2">
                    <Database size={12} /> Transaction_Node_Metadata
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[8px] uppercase text-white/40">ID_PROTO</p>
                        <p className="text-xs Mono font-bold text-accent-cyan truncate">{alert.tx_id}</p>
                    </div>
                    <div>
                        <p className="text-[8px] uppercase text-white/40">Vector_Amount</p>
                        <p className="text-xs Mono font-bold">€ {alert.amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Bayesian Uncertainty Gauge */}
            <div className="space-y-6">
                <p className="text-[10px] font-bold text-accent-slate uppercase tracking-widest flex items-center gap-2">
                    <Gauge size={12} /> Neural_Confidence_Nexus
                </p>
                <div className="relative h-24 flex items-center justify-center">
                    {/* The Arc Gauge */}
                    <div className="absolute inset-0 border-t-[10px] border-white/5 rounded-t-full" />
                    <motion.div
                        initial={{ rotate: -90 }}
                        animate={{ rotate: (mu * 180) - 90 }}
                        className="absolute bottom-0 w-1 h-20 bg-accent-cyan origin-bottom rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20"
                    />
                    {/* Uncertainty Sigma Dispersion Overlay */}
                    <div
                        className={`absolute bottom-0 w-full h-20 bg-gradient-to-t from-transparent to-accent-cyan/20 blur-xl transition-all duration-500`}
                        style={{
                            opacity: sigma > 0.1 ? 0.3 : 0,
                            width: `${sigma * 100}%`,
                            filter: `blur(${sigma * 20}px)`
                        }}
                    />
                    <div className="absolute bottom-4 text-center">
                        <p className="text-3xl font-black italic">{(mu * 100).toFixed(1)}%</p>
                        <p className="text-[8px] uppercase font-bold text-accent-slate tracking-[0.2em]">Risk_Magnitude ($\mu$)</p>
                    </div>
                </div>
                {sigma > 0.15 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg">
                        <AlertCircle size={14} className="text-accent-cyan animate-pulse" />
                        <p className="text-[9px] uppercase font-bold text-accent-cyan tracking-widest">
                            High Epistemic Uncertainty ($\sigma$): Analysis Advised
                        </p>
                    </div>
                )}
            </div>

            {/* SHAP Factor Cascade */}
            <div className="space-y-6">
                <p className="text-[10px] font-bold text-accent-slate uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={12} /> Attribution_Entropy (SHAP)
                </p>
                <div className="space-y-4">
                    {shapFactors.slice(0, 5).map((f, i) => (
                        <div key={f.name} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-80">
                                <span>{f.name}</span>
                                <span className={f.polarity === 'pos' ? 'text-accent-crimson' : 'text-accent-cyan'}>
                                    {f.polarity === 'pos' ? '+' : '-'}{(Math.abs(f.value)).toFixed(2)}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.abs(f.value) * 100}%` }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`h-full ${f.polarity === 'pos' ? 'bg-accent-crimson' : 'bg-accent-cyan'}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
                <button className="Btn-Forensic Btn-Primary w-full py-3">Block Node Protocol</button>
                <button className="Btn-Forensic w-full py-3">Ignore False Positive</button>
            </div>
        </motion.div>
    );
};

export default ForensicDrawer;
