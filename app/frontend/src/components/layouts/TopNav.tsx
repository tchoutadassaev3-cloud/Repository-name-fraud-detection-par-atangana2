import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, RefreshCw, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Tableau de Bord', subtitle: 'Vue d\'ensemble des indicateurs de fraude' },
  '/transactions': { title: 'Transactions', subtitle: 'Surveillance et analyse de toutes les transactions' },
  '/fraud-analysis': { title: 'Analyse de Fraude', subtitle: 'Évaluation du risque par intelligence artificielle' },
  '/alerts': { title: 'Centre d\'Alertes', subtitle: 'Alertes de fraude actives et notifications' },
  '/models': { title: 'Gestion des Modèles', subtitle: 'Déploiement et surveillance des modèles IA' },
  '/realtime': { title: 'Surveillance en Temps Réel', subtitle: 'Flux SOC en direct et alertes WebSocket' },
  '/settings': { title: 'Paramètres', subtitle: 'Configuration et préférences de la plateforme' },
};

interface TopNavProps {
  alertCount?: number;
}

export default function TopNav({ alertCount = 0 }: TopNavProps) {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'AFG Bank SOC', subtitle: '' };
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[#1E293B] bg-[#0B1220]/80 backdrop-blur-sm">
      {/* Gauche : Titre page */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-[#F8FAFC] leading-tight">{pageInfo.title}</h1>
          <p className="text-xs text-[#64748B]">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Droite : Actions */}
      <div className="flex items-center gap-3">
        {/* Horloge */}
        <div className="hidden lg:flex flex-col items-end mr-2">
          <span className="text-xs font-mono text-[#94A3B8]">{timeStr}</span>
          <span className="text-[11px] text-[#64748B] capitalize">{dateStr}</span>
        </div>

        {/* Statut système */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#10B981]/10 border border-[#10B981]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[11px] font-medium text-[#10B981]">OPÉRATIONNEL</span>
        </div>

        {/* Recherche */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                type="text"
                placeholder="Rechercher une transaction..."
                className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6]"
                onBlur={() => setShowSearch(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2234] transition-all duration-200"
          title="Rechercher"
        >
          <Search size={16} />
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2234] transition-all duration-200"
          title="Actualiser"
        >
          <RefreshCw size={16} />
        </button>

        {/* Cloche alertes */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2234] transition-all duration-200">
          <Bell size={16} />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D71920] text-white text-[9px] font-bold flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Badge sécurité */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#003E7E]/20 border border-[#003E7E]/30">
          <Shield size={12} className="text-[#60A5FA]" />
          <span className="text-[11px] font-medium text-[#60A5FA]">SÉCURISÉ</span>
        </div>

        {/* Logo */}
        <div className="hidden lg:block border-l border-[#1E293B] pl-3 ml-1">
          <img
            src="/assets/images/Logo_afg_bank.png"
            alt="AFG Bank"
            className="h-7 w-auto object-contain opacity-90"
          />
        </div>
      </div>
    </header>
  );
}
