import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface Props {
    number: string;
    holder: string;
    expiry: string;
    status: 'Active' | 'Inactive';
}

const CreditCard3D: React.FC<Props> = ({ number, holder, expiry, status }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;
        setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

    const isActive = status === 'Active';

    return (
        <div className="card-3d-wrapper w-[340px] h-[210px] cursor-pointer">
            <motion.div
                ref={cardRef}
                className={`card-3d w-full h-full p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 ${isActive ? 'Glow-Emerald' : 'grayscale opacity-50'}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                animate={{ rotateX: rotate.x, rotateY: rotate.y }}
                style={{
                    background: isActive
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                        : '#0f172a',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #334155'
                }}
            >
                {/* Hologram Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan/10 to-transparent pointer-events-none" />

                <div className="flex justify-between items-start">
                    <div className="w-12 h-10 bg-gradient-to-br from-amber-400 to-amber-200 rounded opacity-80 shadow-inner" />
                    <Wifi className="text-white/20" />
                </div>

                <div className="space-y-4">
                    <p className="text-xl Mono font-bold tracking-[0.2em] text-white/90">
                        {number}
                    </p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[8px] uppercase tracking-widest text-white/40">Card Holder</p>
                            <p className="text-xs font-bold uppercase text-white/80">{holder}</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase tracking-widest text-white/40">Expires</p>
                            <p className="text-xs font-bold text-white/80">{expiry}</p>
                        </div>
                    </div>
                </div>

                {/* Status Chip */}
                <div className={`absolute top-6 right-6 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${isActive ? 'bg-accent-emerald text-bg-deep' : 'bg-slate-700 text-slate-300'}`}>
                    {status}
                </div>
            </motion.div>
        </div>
    );
};

export default CreditCard3D;
