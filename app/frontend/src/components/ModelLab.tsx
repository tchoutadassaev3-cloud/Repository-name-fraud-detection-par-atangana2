import React, { useState } from 'react';
import { Upload, Cpu, CheckCircle2, Server } from 'lucide-react';
import { modelService } from '../services/api';
import { useTelemetryStore } from '../store/useTelemetryStore';

const ModelLab: React.FC = () => {
    const { activeModel, setActiveModel } = useTelemetryStore();
    const [isDragging, setIsDragging] = useState(false);

    const models = [
        { id: 'NEXUS_BAYES_V4', name: 'Nexus Bayésien (Sovereign)', type: 'Hybrid', latency: '4ms' },
        { id: 'XGB_FORENSIC_7', name: 'XGBoost Forensic (Optimized)', type: 'Gradient Boosting', latency: '2ms' },
        { id: 'BRF_METROLOGY_2', name: 'Balanced RF (Metrology)', type: 'Random Forest', latency: '8ms' },
    ];

    const handleActivate = async (id: string) => {
        try {
            await modelService.activate(id);
            setActiveModel(id);
            // Logic for toast message would go here
        } catch (e) {
            console.error('Failed to switch model', e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-accent-slate border-l-2 border-accent-cyan pl-4">MLOps Infrastructure</h2>
                <div className="flex items-center gap-2 text-[10px] font-bold text-accent-emerald animate-pulse">
                    <Server size={12} /> ENGINE_ACTIVE
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Model Registry Hot-Swapping */}
                <div className="space-y-4">
                    {models.map((m) => (
                        <div
                            key={m.id}
                            className={`Glass-Card p-4 flex items-center justify-between border-l-4 transition-all duration-300 ${activeModel === m.id ? 'border-accent-cyan bg-accent-cyan/5' : 'border-transparent'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${activeModel === m.id ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-accent-slate'}`}>
                                    <Cpu size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-tight">{m.name}</p>
                                    <p className="text-[9px] uppercase text-accent-slate font-mono">{m.type} • {m.latency} Latency</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeModel === m.id ? (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-accent-cyan/10 rounded-full text-accent-cyan text-[9px] font-black uppercase tracking-widest">
                                        <CheckCircle2 size={10} /> Active
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleActivate(m.id)}
                                        className="Btn-Forensic px-3 py-1 text-[9px]"
                                    >
                                        Deploy
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Drag & Drop Upload Zone */}
                <div
                    className={`Glass-Card border-2 border-dashed flex flex-col items-center justify-center p-8 space-y-4 transition-all ${isDragging ? 'border-accent-cyan bg-accent-cyan/5' : 'border-white/10'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); /* handle file here */ }}
                >
                    <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-accent-slate group-hover:text-accent-cyan transition-colors">
                        <Upload size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest">Lancer l'Apprentissage Déconnecté</p>
                        <p className="text-[10px] text-accent-slate mt-1 font-mono uppercase">Glisser un fichier .joblib ou .pkl</p>
                    </div>

                    <button className="Btn-Forensic text-[9px] px-6">Sélectionner Fichier</button>
                </div>
            </div>
        </div>
    );
};

export default ModelLab;
