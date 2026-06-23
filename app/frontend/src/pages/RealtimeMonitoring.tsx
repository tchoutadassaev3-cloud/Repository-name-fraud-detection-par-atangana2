import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Wifi, WifiOff, AlertTriangle, Trash2,
  BarChart2, Clock, DollarSign, ShieldAlert, Zap,
} from 'lucide-react';
import { useWebSocket, WSMessage } from '../hooks/useWebSocket';
import { analyticsService, RealtimeData } from '../services/analyticsService';
import { formatDate, formatCurrency, timeAgo } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SEVERITY_COLORS: Record<string, { text: string; bg: string; border: string; label: string }> = {
  critical: { text: '#FF4D55', bg: 'rgba(215,25,32,0.12)', border: '#D71920', label: 'CRITIQUE' },
  high: { text: '#FB923C', bg: 'rgba(249,115,22,0.12)', border: '#F97316', label: 'ÉLEVÉ' },
  medium: { text: '#FCD34D', bg: 'rgba(245,158,11,0.12)', border: '#F59E0B', label: 'MOYEN' },
  low: { text: '#34D399', bg: 'rgba(16,185,129,0.12)', border: '#10B981', label: 'FAIBLE' },
  info: { text: '#60A5FA', bg: 'rgba(59,130,246,0.12)', border: '#3B82F6', label: 'INFO' },
};

function ConnectionStatus({ status }: { status: string }) {
  const isConnected = status === 'connected';
  const isError = status === 'error';

  const labels: Record<string, string> = {
    connecting: 'Connexion...',
    connected: 'Flux en Direct Actif',
    error: 'Erreur de Connexion',
    disconnected: 'Déconnecté',
  };

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{
        background: isConnected ? 'rgba(16,185,129,0.1)' : isError ? 'rgba(215,25,32,0.1)' : 'rgba(245,158,11,0.1)',
        border: `1px solid ${isConnected ? '#10B981' : isError ? '#D71920' : '#F59E0B'}40`,
        color: isConnected ? '#34D399' : isError ? '#FF4D55' : '#FCD34D',
      }}
    >
      {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
      {labels[status] || 'Inconnu'}
    </div>
  );
}

export default function RealtimeMonitoring() {
  const { messages, isConnected, connectionStatus, clearMessages } = useWebSocket();
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    analyticsService.getRealtime()
      .then(setRealtimeData)
      .catch(() => {})
      .finally(() => setLoadingData(false));

    const interval = setInterval(() => {
      analyticsService.getRealtime().then(setRealtimeData).catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const criticalCount = messages.filter((m) => m.severity === 'critical').length;
  const highCount = messages.filter((m) => m.severity === 'high').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Surveillance en Temps Réel</h2>
          <p className="text-sm text-[#64748B]">Flux SOC en direct via WebSocket</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus status={connectionStatus} />
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] transition-all"
            >
              <Trash2 size={12} />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* KPIs temps réel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Alertes Actives',
            value: loadingData ? '...' : String(realtimeData?.active_alerts ?? messages.length),
            icon: <ShieldAlert size={16} />,
            color: '#FF4D55',
            bg: 'rgba(215,25,32,0.1)',
            border: 'rgba(215,25,32,0.2)',
          },
          {
            label: 'Tx / Minute',
            value: loadingData ? '...' : String(realtimeData?.transactions_per_minute ?? '—'),
            icon: <BarChart2 size={16} />,
            color: '#60A5FA',
            bg: 'rgba(59,130,246,0.1)',
            border: 'rgba(59,130,246,0.2)',
          },
          {
            label: 'Fraudes Détectées Aujourd\'hui',
            value: loadingData ? '...' : String(realtimeData?.fraud_detected_today ?? criticalCount + highCount),
            icon: <AlertTriangle size={16} />,
            color: '#FCD34D',
            bg: 'rgba(245,158,11,0.1)',
            border: 'rgba(245,158,11,0.2)',
          },
          {
            label: 'Statut Système',
            value: realtimeData?.system_status ?? 'Opérationnel',
            icon: <Activity size={16} />,
            color: '#34D399',
            bg: 'rgba(16,185,129,0.1)',
            border: 'rgba(16,185,129,0.2)',
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl p-4 flex items-center gap-3 border"
            style={{ background: item.bg, borderColor: item.border }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${item.color}25`, color: item.color }}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-[#64748B]">{item.label}</p>
              <p className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Flux en direct */}
        <div className="xl:col-span-2">
          <div
            className="rounded-xl border border-[#1E293B] overflow-hidden"
            style={{ background: 'rgba(17,24,39,0.95)' }}
          >
            {/* En-tête flux */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-6 h-6">
                  <span className="absolute w-full h-full rounded-full bg-[#D71920]/20 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-[#D71920]" />
                </div>
                <span className="text-sm font-semibold text-[#F8FAFC]">Flux d'Alertes en Direct</span>
                <span className="text-xs text-[#64748B]">({messages.length} événements)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <Zap size={12} className={isConnected ? 'text-[#10B981]' : 'text-[#64748B]'} />
                WebSocket
              </div>
            </div>

            {/* Corps du flux */}
            <div className="h-[480px] overflow-y-auto p-3 space-y-2">
              {!isConnected && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A2234] flex items-center justify-center">
                    <WifiOff size={24} className="text-[#64748B]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#94A3B8]">Connexion au WebSocket...</p>
                    <p className="text-xs text-[#64748B] mt-1">Les alertes en direct apparaîtront ici une fois connecté</p>
                  </div>
                  {connectionStatus === 'connecting' && <LoadingSpinner size="sm" />}
                </div>
              )}

              {isConnected && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A2234] flex items-center justify-center">
                    <Activity size={24} className="text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F8FAFC]">Surveillance Active</p>
                    <p className="text-xs text-[#64748B] mt-1">En attente d'événements de fraude...</p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg: WSMessage) => {
                  const sev = (msg.severity?.toLowerCase() as keyof typeof SEVERITY_COLORS) || 'info';
                  const cfg = SEVERITY_COLORS[sev] || SEVERITY_COLORS.info;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-lg border p-3"
                      style={{
                        background: cfg.bg,
                        borderColor: `${cfg.border}50`,
                        borderLeft: `2px solid ${cfg.border}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: cfg.text, background: `${cfg.border}25` }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-[10px] font-mono text-[#64748B]">
                              {msg.type?.toUpperCase() || 'ALERTE'}
                            </span>
                          </div>
                          <p className="text-xs text-[#F8FAFC] font-medium leading-snug">{msg.message}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {msg.transaction_id && (
                              <span className="text-[10px] text-[#64748B] font-mono">
                                TX : #{msg.transaction_id.slice(0, 10)}
                              </span>
                            )}
                            {msg.amount != null && (
                              <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                                <DollarSign size={9} />
                                {formatCurrency(msg.amount)}
                              </span>
                            )}
                            {msg.merchant && (
                              <span className="text-[10px] text-[#64748B]">{msg.merchant}</span>
                            )}
                            {msg.fraud_score != null && (
                              <span className="text-[10px] text-[#F59E0B]">
                                Score : {(msg.fraud_score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#64748B] shrink-0 flex items-center gap-1">
                          <Clock size={9} />
                          {timeAgo(msg.timestamp)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          {/* Statistiques session */}
          <div
            className="rounded-xl border border-[#1E293B] p-4"
            style={{ background: 'rgba(17,24,39,0.95)' }}
          >
            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">Statistiques de Session</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Événements', value: messages.length, color: '#60A5FA' },
                { label: 'Alertes Critiques', value: criticalCount, color: '#FF4D55' },
                { label: 'Sévérité Élevée', value: highCount, color: '#FB923C' },
                { label: 'Moyen / Faible', value: messages.length - criticalCount - highCount, color: '#FCD34D' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">{label}</span>
                  <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infos connexion */}
          <div
            className="rounded-xl border border-[#1E293B] p-4"
            style={{ background: 'rgba(17,24,39,0.95)' }}
          >
            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">Informations de Connexion</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Protocole</span>
                <span className="text-[#F8FAFC] font-mono">WebSocket</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Statut</span>
                <span
                  className="font-medium capitalize"
                  style={{ color: isConnected ? '#34D399' : '#FF4D55' }}
                >
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Endpoint</span>
                <span className="text-[#60A5FA] font-mono text-[10px] truncate ml-2 max-w-[140px]">
                  /ws/alerts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Reconnexion auto</span>
                <span className="text-[#34D399]">Activée</span>
              </div>
            </div>
          </div>

          {/* Événements récents */}
          {realtimeData?.recent_events && realtimeData.recent_events.length > 0 && (
            <div
              className="rounded-xl border border-[#1E293B] p-4"
              style={{ background: 'rgba(17,24,39,0.95)' }}
            >
              <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">Événements Récents (API)</h3>
              <div className="space-y-2">
                {realtimeData.recent_events.slice(0, 5).map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0056A6] shrink-0 mt-1.5" />
                    <div>
                      <p className="text-[#94A3B8]">{ev.message}</p>
                      <p className="text-[#64748B]">{timeAgo(ev.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
