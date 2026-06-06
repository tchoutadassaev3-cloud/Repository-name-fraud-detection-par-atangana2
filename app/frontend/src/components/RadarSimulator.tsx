import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
    status: 'idle' | 'scanning' | 'approved' | 'refused';
}

const RadarSimulator: React.FC<Props> = ({ status }) => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Background Rings */}
            <div className="absolute inset-0 border border-white/5 rounded-full" />
            <div className="absolute inset-8 border border-white/5 rounded-full" />
            <div className="absolute inset-16 border border-white/5 rounded-full" />

            {/* Pulsing Radar (Scanning State) */}
            <AnimatePresence>
                {status === 'scanning' && (
                    <>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inset-0 border-2 border-accent-cyan/20 rounded-full"
                        />
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-2 border-t-accent-cyan/40 rounded-full"
                        />
                    </>
                )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col items-center gap-2">
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-accent-slate">
                            <Cpu size={48} className="animate-pulse" />
                        </motion.div>
                    )}
                    {status === 'scanning' && (
                        <motion.div key="scanning" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }}>
                            <div className="text-accent-cyan text-center">
                                <Cpu size={48} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">IA_ANALYSIS_IN_PROGRESS</p>
                            </div>
                        </motion.div>
                    )}
                    {status === 'approved' && (
                        <motion.div
                            key="approved"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 bg-accent-emerald/20 border-2 border-accent-emerald rounded-full flex items-center justify-center text-accent-emerald shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <ShieldCheck size={40} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-accent-emerald">Transaction Approuvée</p>
                        </motion.div>
                    )}
                    {status === 'refused' && (
                        <motion.div
                            key="refused"
                            initial={{ scale: 0, rotate: 90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 bg-accent-crimson/20 border-2 border-accent-crimson rounded-full flex items-center justify-center text-accent-crimson shadow-[0_0_30px_rgba(225,29,72,0.3)]">
                                <ShieldAlert size={40} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-accent-crimson">Alerte Fraude : Bloquée</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RadarSimulator;
