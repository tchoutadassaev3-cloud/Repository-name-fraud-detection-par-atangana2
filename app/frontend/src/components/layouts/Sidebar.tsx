import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  Bell,
  Brain,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: CreditCard },
  { path: '/fraud-analysis', label: 'Analyse Fraude', icon: ShieldAlert },
  { path: '/alerts', label: 'Centre d\'Alertes', icon: Bell },
  { path: '/models', label: 'Modèles IA', icon: Brain },
  { path: '/realtime', label: 'Surveillance Live', icon: Activity },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #0B1220 100%)',
        borderRight: '1px solid #1E293B',
      }}
    >
      {/* En-tête */}
      <div className="flex items-center h-16 px-3 border-b border-[#1E293B] shrink-0">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <img
                src="/assets/images/Logo_afg_bank.png"
                alt="AFG Bank"
                className="h-8 w-auto object-contain shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">
                  Détection Fraude
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center w-full"
            >
              <img
                src="/assets/images/Logo_afg_bank.png"
                alt="AFG Bank"
                className="h-7 w-auto object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <NavLink key={path} to={path}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-[#003E7E]/30 text-[#60A5FA] border border-[#003E7E]/40'
                    : 'text-[#94A3B8] hover:bg-[#1A2234] hover:text-[#F8FAFC]'
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-[#60A5FA]' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1 h-4 rounded-full bg-[#0056A6] shrink-0"
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Indicateur live */}
      {!collapsed && (
        <div className="mx-2 mb-3 px-3 py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Wifi size={13} className="text-[#10B981]" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
            </div>
            <span className="text-[11px] text-[#10B981] font-medium">SOC — Surveillance Active</span>
          </div>
        </div>
      )}

      {/* Section bas */}
      <div className="border-t border-[#1E293B] py-3 px-2 space-y-1">
        <NavLink to="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#94A3B8] hover:bg-[#1A2234] hover:text-[#F8FAFC] cursor-pointer transition-all duration-200">
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Paramètres</span>}
          </div>
        </NavLink>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1A2234] mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#003E7E] to-[#0056A6] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[#F8FAFC] truncate">{user?.username || 'Analyste'}</p>
              <p className="text-[11px] text-[#64748B] truncate capitalize">{user?.role || 'Analyste SOC'}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#94A3B8] hover:bg-[#D71920]/10 hover:text-[#D71920] cursor-pointer transition-all duration-200"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>

      {/* Bouton réduire */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-[#1E293B] border border-[#2D3748] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#0056A6] transition-all duration-200"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
