import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, ShieldAlert, XCircle, CheckCircle,
  Filter, RefreshCw, Clock, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { alertsService, Alert } from '../services/alertsService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatCurrency, timeAgo } from '../utils/formatters';

const SEVERITY_CONFIG = {
  critical: { color: '#D71920', bg: 'rgba(215,25,32,0.1)', border: '#D71920', icon: XCircle, label: 'CRITIQUE' },
  high: { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: '#F97316', icon: AlertTriangle, label: 'ÉLEVÉ' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: '#F59E0B', icon: Bell, label: 'MOYEN' },
  low: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: '#10B981', icon: CheckCircle, label: 'FAIBLE' },
};

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alertsService.getAlerts({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
      });
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
      setCriticalCount(data.critical_count || (data.alerts || []).filter((a) => a.severity === 'critical').length);
    } catch {
      toast.error('Impossible de charger les alertes');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Centre d'Alertes</h2>
          <p className="text-sm text-[#64748B]">Alertes de fraude actives et incidents de sécurité</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] transition-all"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alertes', value: total, color: '#60A5FA', icon: Bell, bg: 'rgba(59,130,246,0.1)' },
          { label: 'Critiques', value: criticalCount, color: '#FF4D55', icon: XCircle, bg: 'rgba(215,25,32,0.1)' },
          { label: 'Ouvertes', value: filteredAlerts.filter((a) => a.status === 'open').length, color: '#F97316', icon: AlertTriangle, bg: 'rgba(249,115,22,0.1)' },
          { label: 'Résolues', value: filteredAlerts.filter((a) => a.status === 'resolved').length, color: '#34D399', icon: CheckCircle, bg: 'rgba(16,185,129,0.1)' },
        ].map(({ label, value, color, icon: Icon, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ borderColor: `${color}30`, background: bg }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">{label}</p>
              <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#1A2234] border border-[#1E293B] rounded-lg pl-8 pr-8 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0056A6] appearance-none cursor-pointer"
          >
            <option value="">Toutes les Sévérités</option>
            <option value="critical">Critique</option>
            <option value="high">Élevé</option>
            <option value="medium">Moyen</option>
            <option value="low">Faible</option>
          </select>
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1A2234] border border-[#1E293B] rounded-lg pl-8 pr-8 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0056A6] appearance-none cursor-pointer"
          >
            <option value="">Tous les Statuts</option>
            <option value="open">Ouverte</option>
            <option value="resolved">Résolue</option>
            <option value="investigating">En investigation</option>
          </select>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-[#1E293B] py-4" style={{ background: 'rgba(17,24,39,0.95)' }}>
            <EmptyState
              title="Aucune alerte trouvée"
              description="Aucune alerte ne correspond aux filtres actuels."
              icon={<Bell size={24} />}
            />
          </div>
        ) : (
          <AnimatePresence>
            {filteredAlerts.map((alert, i) => {
              const sev = (alert.severity?.toLowerCase() as keyof typeof SEVERITY_CONFIG) || 'medium';
              const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.medium;
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={alert.id || i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border p-4 group cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: `${cfg.border}40`,
                    background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(17,24,39,0.95) 100%)`,
                    borderLeft: `3px solid ${cfg.color}`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}20`, color: cfg.color }}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded border"
                            style={{ color: cfg.color, borderColor: `${cfg.color}50`, background: `${cfg.color}15` }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            #{String(alert.alert_id || alert.id || '').slice(0, 12)}
                          </span>
                          <StatusBadge status={alert.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <Clock size={11} />
                          {timeAgo(alert.created_at)}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-[#F8FAFC] mt-2 leading-snug">{alert.message}</p>

                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {alert.transaction_id && (
                          <span className="text-xs text-[#64748B] flex items-center gap-1">
                            <ShieldAlert size={11} />
                            TX : <span className="font-mono text-[#60A5FA]">#{alert.transaction_id.slice(0, 10)}</span>
                          </span>
                        )}
                        {alert.amount && (
                          <span className="text-xs text-[#64748B] flex items-center gap-1">
                            <DollarSign size={11} />
                            {formatCurrency(alert.amount)}
                          </span>
                        )}
                        {alert.merchant && (
                          <span className="text-xs text-[#64748B]">{alert.merchant}</span>
                        )}
                        <span className="text-xs text-[#64748B]">{formatDate(alert.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
