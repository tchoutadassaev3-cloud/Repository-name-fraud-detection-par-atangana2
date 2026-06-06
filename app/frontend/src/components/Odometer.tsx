import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
    value: number;
    label: string;
    icon: React.ReactNode;
    colorClass?: string;
}

const Odometer: React.FC<Props> = ({ value, label, icon, colorClass = "text-accent-cyan" }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    return (
        <div className="Glass-Card p-6 flex items-center justify-between group overflow-hidden relative">
            {/* Background Pulse on Change */}
            <motion.div
                key={value}
                initial={{ opacity: 0.2, scale: 0.8 }}
                animate={{ opacity: 0, scale: 2 }}
                className={`absolute inset-0 bg-current opacity-0 ${colorClass}`}
            />

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-accent-slate uppercase tracking-widest">{label}</p>
                <div className={`text-3xl font-black Mono flex items-baseline gap-1 ${colorClass}`}>
                    <span className="Odometer">{displayValue.toLocaleString()}</span>
                </div>
            </div>

            <div className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-current transition-colors ${colorClass}`}>
                {icon}
            </div>
        </div>
    );
};

export default Odometer;
