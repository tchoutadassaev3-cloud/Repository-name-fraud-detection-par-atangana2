import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Cpu, Globe, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { useTelemetryStore } from '../store/useTelemetryStore';
import NetworkCanvas from '../components/NetworkCanvas';
import { useNavigate } from 'react-router-dom';

const LoginView: React.FC = () => {
    const [username, setUsername] = useState('admin@forensic.noc');
    const [password, setPassword] = useState('core-access-77');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const setUser = useTelemetryStore(state => state.setUser);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        try {
            const res = await authService.login({ username, password });
            setUser(res.data);
            navigate(res.data.role === 'admin' ? '/supervisor' : '/client');
        } catch (err) {
            setError(true);
            setTimeout(() => setError(false), 500); // Reset shake after 500ms
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-bg-deep overflow-hidden">
            {/* Left Panel: The Cyber Lattice */}
            <div className="relative hidden lg:flex items-center justify-center bg-bg-surface overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 to-transparent opacity-50" />
                <NetworkCanvas />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-accent-cyan/10 rounded-3xl border border-accent-cyan/20 flex items-center justify-center mx-auto backdrop-blur-xl">
                        <Shield size={48} className="text-accent-cyan" />
                    </div>
                    <h1 className="NOC-Title text-4xl">Forensic NOC</h1>
                    <p className="text-accent-slate font-mono text-sm tracking-widest uppercase">
                        Mission Critical Integrity Node
                    </p>
                </motion.div>
            </div>

            {/* Right Panel: The High-Fidelity Form */}
            <div className="flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`Glass-Card w-full max-w-md p-10 space-y-10 border-t-2 border-t-accent-cyan/30 ${error ? 'animate-shake border-accent-crimson' : ''}`}
                >
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic">Authorize Access</h2>
                        <p className="text-xs text-accent-slate font-medium uppercase tracking-widest">Provide Forensic Protocol Credentials</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent-slate uppercase tracking-widest">Node Identifier</label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-slate" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="Glass-Input w-full pl-10 font-mono text-sm"
                                    placeholder="ID_NOD_77"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent-slate uppercase tracking-widest">Access Protocol</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-slate" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="Glass-Input w-full pl-10 font-mono text-sm"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="Btn-Forensic Btn-Primary w-full py-4 relative overflow-hidden group"
                            disabled={loading}
                        >
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-4 h-4 border-2 border-bg-deep border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-black uppercase tracking-tighter">Scanning Biometrics...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="font-black uppercase tracking-tighter">Authorize Entry</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </form>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-accent-slate uppercase tracking-widest">
                            <Cpu size={12} /> HW_SECURE: ACTIVE
                        </div>
                        <div className="text-[9px] font-bold text-accent-cyan uppercase tracking-widest animate-pulse">
                            WS_LINK: STABLE
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginView;
