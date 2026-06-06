import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, DollarSign, Wallet, ChevronRight } from 'lucide-react';
import { transactionService } from '../services/api';
import CreditCard3D from '../components/CreditCard3D';
import RadarSimulator from '../components/RadarSimulator';
import { useTelemetryStore } from '../store/useTelemetryStore';

const ClientView: React.FC = () => {
    const user = useTelemetryStore(state => state.user);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'approved' | 'refused'>('idle');
    const [formData, setFormData] = useState({
        amount: '',
        merchant: 'Amazon Forensic Node',
        lat: '48.8566',
        long: '2.3522'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('scanning');

        // Simulate network/IA latency
        setTimeout(async () => {
            try {
                const res = await transactionService.simulate({
                    ...formData,
                    category: 'online_shopping',
                    unix_time: Math.floor(Date.now() / 1000)
                });
                setStatus(res.data.is_fraud ? 'refused' : 'approved');
            } catch (err) {
                setStatus('idle');
            }
        }, 2500);
    };

    return (
        <div className="min-h-screen bg-bg-deep text-white p-8">
            <header className="max-w-7xl mx-auto flex justify-between items-end mb-16">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Sovereign Wallet</h1>
                    <p className="text-xs text-accent-slate uppercase font-bold tracking-widest mt-2">Authenticated as: <span className="text-accent-cyan">{user?.name}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-accent-slate uppercase tracking-[0.2em]">Hardware_State</p>
                    <p className="text-xs font-black text-accent-emerald uppercase">Protocol_Secure</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Card Gallery */}
                <div className="lg:col-span-5 space-y-12">
                    <div className="space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-widest text-accent-slate border-l-2 border-accent-cyan pl-4">Monetic Assets</h2>
                        <div className="space-y-8">
                            <CreditCard3D number="•••• •••• •••• 7788" holder={user?.name || "USAGER_PROTOCOL"} expiry="09/28" status="Active" />
                            <CreditCard3D number="•••• •••• •••• 1122" holder={user?.name || "USAGER_PROTOCOL"} expiry="12/26" status="Inactive" />
                        </div>
                    </div>
                </div>

                {/* Right: Payment Simulation */}
                <div className="lg:col-span-7">
                    <AnimatePresence mode="wait">
                        {status === 'idle' ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="Glass-Card p-10 space-y-8 border-t-2 border-t-accent-cyan"
                            >
                                <div className="flex items-center gap-4 text-accent-cyan">
                                    <ShoppingCart size={32} />
                                    <h3 className="text-xl font-bold uppercase tracking-tight">Express Transaction Simulator</h3>
                                </div>

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-accent-slate uppercase tracking-widest">Transaction Amount (EUR)</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-slate" />
                                            <input
                                                type="number"
                                                className="Glass-Input w-full pl-10"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-accent-slate uppercase tracking-widest">Merchant Node</label>
                                        <div className="relative">
                                            <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-slate" />
                                            <input type="text" className="Glass-Input w-full pl-10" value={formData.merchant} readOnly />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-bold text-accent-slate uppercase tracking-widest">Geospatial Vectors (Lat/Long)</label>
                                        <div className="flex gap-4">
                                            <input type="text" className="Glass-Input flex-1" value={formData.lat} readOnly />
                                            <input type="text" className="Glass-Input flex-1" value={formData.long} readOnly />
                                        </div>
                                    </div>

                                    <button type="submit" className="Btn-Forensic Btn-Primary md:col-span-2 py-5 mt-4">
                                        Confirm Monetic Link <ChevronRight size={18} />
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="radar"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="h-full min-h-[500px] Glass-Card flex flex-col items-center justify-center p-12 space-y-12"
                            >
                                <RadarSimulator status={status} />

                                {status !== 'scanning' && (
                                    <button onClick={() => setStatus('idle')} className="Btn-Forensic px-8">
                                        Return to Terminal
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default ClientView;
