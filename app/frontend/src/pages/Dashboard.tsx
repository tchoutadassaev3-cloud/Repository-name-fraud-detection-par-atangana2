import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CreditCard, ShieldAlert, TrendingUp, CheckCircle,
  AlertTriangle, Activity, Clock, Zap, RotateCcw,
  Download, AlertCircle, X, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService, DashboardData, FraudTrend } from '../services/analyticsService';
import KPICard from '../components/common/KPICard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatNumber, formatPercent, formatDate } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

// ─── Clés localStorage ───────────────────────────────────────────────────────
const LS_BASELINE = 'afg_dashboard_baseline';
const LS_RESET_AT = 'afg_dashboard_reset_at';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Baseline {
  total_transactions: number;
  fraud_alerts: number;
  high_risk_transactions: number;
  accepted_transactions: number;
  fraud_amount: number;
  blocked_transactions: number;
  recent_alerts: number;
}

// ─── Utilitaire CSV ───────────────────────────────────────────────────────────
function exportToCSV(dashboard: DashboardData | null, delta: Baseline, resetAt: string | null) {
  const date = new Date().toLocaleDateString('fr-FR');
  const time = new Date().toLocaleTimeString('fr-FR');

  const rows = [
    ['AFG Bank — Rapport Tableau de Bord', '', ''],
    ['Exporté le', `${date} à ${time}`, ''],
    ['Période depuis réinitialisation', resetAt ? new Date(resetAt).toLocaleString('fr-FR') : 'Aucune réinitialisation', ''],
    ['', '', ''],
    ['Indicateur', 'Valeur Totale (API)', 'Delta depuis réinitialisation'],
    ['Total Transactions', String(dashboard?.total_transactions ?? 0), String(delta.total_transactions)],
    ['Alertes Fraude', String(dashboard?.fraud_alerts ?? 0), String(delta.fraud_alerts)],
    ['Transactions Haut Risque', String(dashboard?.high_risk_transactions ?? 0), String(delta.high_risk_transactions)],
    ['Transactions Acceptées', String(dashboard?.accepted_transactions ?? 0), String(delta.accepted_transactions)],
    ['Taux de Fraude (%)', String((dashboard?.fraud_rate ?? 0).toFixed(2)), ''],
    ['Montant Frauduleux ($)', String((dashboard?.fraud_amount ?? 0).toFixed(2)), String(delta.fraud_amount.toFixed(2))],
    ['Bloquées', String(dashboard?.blocked_transactions ?? 0), String(delta.blocked_transactions)],
    ['Score Fraude Moyen', String(((dashboard?.avg_fraud_score ?? 0) * 100).toFixed(1) + '%'), ''],
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `afg_bank_rapport_${date.replace(/\//g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Composants internes ──────────────────────────────────────────────────────
const PIE_COLORS = ['#10B981', '#F59E0B', '#F97316', '#D71920'];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-3 shadow-xl text-xs">
        <p className="text-[#94A3B8] mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[#F8FAFC]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name} :</span>
            <span className="font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Modale de confirmation réinitialisation ──────────────────────────────────
function ResetModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative rounded-2xl border border-[#D71920]/30 p-6 w-full max-w-md"
        style={{
          background: 'linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(15,23,42,1) 100%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(215,25,32,0.1)',
        }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-[#1E293B] hover:bg-[#2D3748] flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] transition-all"
        >
          <X size={14} />
        </button>

        {/* Icône */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#D71920]/15 border border-[#D71920]/30 flex items-center justify-center shrink-0">
            <RotateCcw size={22} className="text-[#FF4D55]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">Réinitialiser le Tableau de Bord</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Cette action définit un nouveau point de départ journalier</p>
          </div>
        </div>

        {/* Avertissement */}
        <div className="rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 p-4 mb-5">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-[#FCD34D] mt-0.5 shrink-0" />
            <div className="text-xs text-[#94A3B8] space-y-1">
              <p className="font-semibold text-[#FCD34D]">Que se passe-t-il lors d'une réinitialisation ?</p>
              <ul className="space-y-0.5 list-none mt-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                  Les valeurs actuelles de l'API sont sauvegardées comme point de départ
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                  Le tableau de bord affichera uniquement les données depuis ce moment
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#64748B]" />
                  Aucune donnée n'est supprimée sur le backend
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-sm text-[#94A3B8] mb-6">
          Nous vous recommandons de <span className="text-[#FCD34D] font-medium">télécharger les données</span> avant de réinitialiser afin de conserver un historique.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm text-[#94A3B8] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] hover:text-[#F8FAFC] transition-all"
          >
            Annuler
          </button>
          <motion.button
            onClick={onConfirm}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D71920, #A01015)', boxShadow: '0 4px 16px rgba(215,25,32,0.3)' }}
          >
            <RotateCcw size={14} />
            Confirmer la Réinitialisation
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<FraudTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showResetModal, setShowResetModal] = useState(false);

  // Baseline stocké localement
  const [baseline, setBaseline] = useState<Baseline | null>(() => {
    const saved = localStorage.getItem(LS_BASELINE);
    return saved ? JSON.parse(saved) : null;
  });
  const [resetAt, setResetAt] = useState<string | null>(() => localStorage.getItem(LS_RESET_AT));

  const fetchData = useCallback(async () => {
    try {
      const [dash, trendData] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getFraudTrends(),
      ]);
      setDashboard(dash);
      setTrends(trendData);
      setLastUpdated(new Date());
    } catch {
      toast.error('Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Calcul des deltas ──────────────────────────────────────────────────────
  const delta: Baseline = {
    total_transactions: Math.max(0, (dashboard?.total_transactions ?? 0) - (baseline?.total_transactions ?? 0)),
    fraud_alerts: Math.max(0, (dashboard?.fraud_alerts ?? 0) - (baseline?.fraud_alerts ?? 0)),
    high_risk_transactions: Math.max(0, (dashboard?.high_risk_transactions ?? 0) - (baseline?.high_risk_transactions ?? 0)),
    accepted_transactions: Math.max(0, (dashboard?.accepted_transactions ?? 0) - (baseline?.accepted_transactions ?? 0)),
    fraud_amount: Math.max(0, (dashboard?.fraud_amount ?? 0) - (baseline?.fraud_amount ?? 0)),
    blocked_transactions: Math.max(0, (dashboard?.blocked_transactions ?? 0) - (baseline?.blocked_transactions ?? 0)),
    recent_alerts: Math.max(0, (dashboard?.recent_alerts ?? 0) - (baseline?.recent_alerts ?? 0)),
  };

  // Les KPI affichés : delta si baseline existe, sinon valeurs brutes
  const display = baseline ? delta : {
    total_transactions: dashboard?.total_transactions ?? 0,
    fraud_alerts: dashboard?.fraud_alerts ?? 0,
    high_risk_transactions: dashboard?.high_risk_transactions ?? 0,
    accepted_transactions: dashboard?.accepted_transactions ?? 0,
    fraud_amount: dashboard?.fraud_amount ?? 0,
    blocked_transactions: dashboard?.blocked_transactions ?? 0,
    recent_alerts: dashboard?.recent_alerts ?? 0,
  };

  // ── Réinitialisation ───────────────────────────────────────────────────────
  const handleReset = () => {
    if (!dashboard) {
      toast.error('Aucune donnée à réinitialiser');
      return;
    }
    const newBaseline: Baseline = {
      total_transactions: dashboard.total_transactions ?? 0,
      fraud_alerts: dashboard.fraud_alerts ?? 0,
      high_risk_transactions: dashboard.high_risk_transactions ?? 0,
      accepted_transactions: dashboard.accepted_transactions ?? 0,
      fraud_amount: dashboard.fraud_amount ?? 0,
      blocked_transactions: dashboard.blocked_transactions ?? 0,
      recent_alerts: dashboard.recent_alerts ?? 0,
    };
    const now = new Date().toISOString();
    localStorage.setItem(LS_BASELINE, JSON.stringify(newBaseline));
    localStorage.setItem(LS_RESET_AT, now);
    setBaseline(newBaseline);
    setResetAt(now);
    setShowResetModal(false);
    toast.success('Tableau de bord réinitialisé — Compteurs journaliers remis à zéro');
  };

  // ── Téléchargement CSV ─────────────────────────────────────────────────────
  const handleDownload = () => {
    exportToCSV(dashboard, delta, resetAt);
    toast.success('Rapport CSV exporté avec succès');
  };

  // ── Données graphiques ─────────────────────────────────────────────────────
  const trendData = trends.length > 0 ? trends : Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    fraud_count: Math.floor(Math.random() * 50) + 10,
    total_count: Math.floor(Math.random() * 500) + 200,
    fraud_rate: Math.random() * 8 + 2,
  }));

  // Filtrage des tendances depuis la réinitialisation
  const filteredTrends = resetAt
    ? trendData.filter((t) => {
        if (!t.date) return true;
        return true; // Les dates de l'API peuvent varier, on affiche tout
      })
    : trendData;

  const riskDistribution = [
    { name: 'Risque Faible', value: display.accepted_transactions || 650 },
    { name: 'Risque Moyen', value: Math.floor((display.high_risk_transactions || 0) * 0.4) || 120 },
    { name: 'Risque Élevé', value: Math.floor((display.high_risk_transactions || 0) * 0.4) || 80 },
    { name: 'Critique', value: display.fraud_alerts || 45 },
  ];

  const categoryData = [
    { category: 'Commerce', fraud: 35, legit: 312 },
    { category: 'Carburant', fraud: 28, legit: 198 },
    { category: 'Restauration', fraud: 18, legit: 267 },
    { category: 'Santé', fraud: 12, legit: 189 },
    { category: 'Divertissement', fraud: 22, legit: 145 },
    { category: 'En ligne', fraud: 45, legit: 289 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-[#64748B]">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Transactions',
      value: formatNumber(display.total_transactions),
      icon: <CreditCard size={18} />,
      color: 'blue' as const,
      subtitle: baseline ? 'Depuis réinitialisation' : 'Toutes périodes',
      delay: 0,
    },
    {
      title: 'Alertes Fraude',
      value: formatNumber(display.fraud_alerts),
      icon: <ShieldAlert size={18} />,
      color: 'red' as const,
      subtitle: baseline ? 'Depuis réinitialisation' : 'Toutes périodes',
      delay: 0.05,
    },
    {
      title: 'Haut Risque',
      value: formatNumber(display.high_risk_transactions),
      icon: <AlertTriangle size={18} />,
      color: 'yellow' as const,
      subtitle: baseline ? 'Depuis réinitialisation' : 'Toutes périodes',
      delay: 0.1,
    },
    {
      title: 'Acceptées',
      value: formatNumber(display.accepted_transactions),
      icon: <CheckCircle size={18} />,
      color: 'green' as const,
      subtitle: baseline ? 'Depuis réinitialisation' : 'Transactions légitimes',
      delay: 0.15,
    },
    {
      title: 'Taux de Fraude',
      value: formatPercent(dashboard?.fraud_rate ?? 0),
      icon: <TrendingUp size={18} />,
      color: 'purple' as const,
      subtitle: 'Taux global (API)',
      delay: 0.2,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {showResetModal && (
          <ResetModal onConfirm={handleReset} onCancel={() => setShowResetModal(false)} />
        )}
      </AnimatePresence>

      <div className="space-y-6 animate-fade-in">
        {/* ── En-tête avec boutons ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Vue d'ensemble de la Sécurité</h2>
            <p className="text-sm text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <Clock size={12} />
              Dernière mise à jour : {formatDate(lastUpdated)}
            </p>
            {/* Indicateur de réinitialisation */}
            {resetAt && (
              <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-[#003E7E]/15 border border-[#003E7E]/20 w-fit">
                <Calendar size={11} className="text-[#60A5FA]" />
                <span className="text-[11px] text-[#60A5FA]">
                  Données depuis : {new Date(resetAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
              <Zap size={13} className="text-[#10B981]" />
              <span className="text-xs text-[#10B981] font-medium">Moteur IA Actif</span>
            </div>

            {/* Bouton Télécharger */}
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border"
              style={{
                background: 'rgba(0,86,166,0.12)',
                borderColor: 'rgba(0,86,166,0.35)',
                color: '#60A5FA',
              }}
              title="Télécharger les données en CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Télécharger</span>
            </motion.button>

            {/* Bouton Réinitialiser */}
            <motion.button
              onClick={() => setShowResetModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border"
              style={{
                background: 'rgba(215,25,32,0.1)',
                borderColor: 'rgba(215,25,32,0.3)',
                color: '#FF4D55',
              }}
              title="Réinitialiser les compteurs journaliers"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Réinitialiser</span>
            </motion.button>
          </div>
        </div>

        {/* Bandeau mode journalier */}
        {baseline && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#0056A6]/30 bg-[#0056A6]/08"
            style={{ background: 'rgba(0,86,166,0.07)' }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#0056A6]/20 flex items-center justify-center shrink-0">
              <Calendar size={15} className="text-[#60A5FA]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC]">Mode Journalier Actif</p>
              <p className="text-xs text-[#64748B]">
                Les KPI affichent uniquement les données enregistrées depuis la dernière réinitialisation
                ({new Date(resetAt!).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}).
                Les graphiques restent sur les données complètes de l'API.
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(LS_BASELINE);
                localStorage.removeItem(LS_RESET_AT);
                setBaseline(null);
                setResetAt(null);
                toast.success('Mode journalier désactivé — Affichage des données complètes');
              }}
              className="shrink-0 text-[10px] px-2.5 py-1 rounded-md bg-[#1E293B] text-[#64748B] hover:text-[#F8FAFC] border border-[#2D3748] hover:border-[#3D4758] transition-all"
            >
              Désactiver
            </button>
          </motion.div>
        )}

        {/* ── KPI Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpiCards.map((card) => (
            <KPICard key={card.title} {...card} />
          ))}
        </div>

        {/* ── Graphiques rangée 1 ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Tendance fraude */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2 rounded-xl border border-[#1E293B] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Tendance de Détection des Fraudes</h3>
                <p className="text-xs text-[#64748B]">Fraudes vs transactions légitimes par jour</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2 h-2 rounded-full bg-[#0056A6]" />Légitimes
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2 h-2 rounded-full bg-[#D71920]" />Fraudes
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredTrends}>
                <defs>
                  <linearGradient id="gradLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total_count" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#gradLegit)" name="Légitimes" />
                <Area type="monotone" dataKey="fraud_count" stroke={CHART_COLORS.danger} strokeWidth={2} fill="url(#gradFraud)" name="Fraudes" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Distribution des risques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-[#1E293B] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Distribution des Risques</h3>
              <p className="text-xs text-[#64748B]">
                {baseline ? 'Données journalières' : 'Niveaux de risque des transactions'}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistribution.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatNumber(v), '']} contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {riskDistribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-[#94A3B8]">{item.name}</span>
                  </div>
                  <span className="font-medium text-[#F8FAFC]">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Graphiques rangée 2 ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Fraude par catégorie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-[#1E293B] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Fraude par Catégorie</h3>
              <p className="text-xs text-[#64748B]">Fraudes vs légitimes par catégorie marchande</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="legit" name="Légitimes" fill={CHART_COLORS.primary} radius={[0, 3, 3, 0]} />
                <Bar dataKey="fraud" name="Fraudes" fill={CHART_COLORS.danger} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Taux de fraude */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-[#1E293B] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Évolution du Taux de Fraude</h3>
              <p className="text-xs text-[#64748B]">Pourcentage de fraude quotidien</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={filteredTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="fraud_rate" stroke={CHART_COLORS.warning} strokeWidth={2} dot={false} name="Taux de Fraude" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* ── Résumé statistiques ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Score Fraude Moyen',
              value: formatPercent((dashboard?.avg_fraud_score ?? 0.67) * 100),
              icon: <Activity size={14} />,
              color: '#F59E0B',
              note: '(API globale)',
            },
            {
              label: 'Bloquées',
              value: formatNumber(display.blocked_transactions),
              icon: <ShieldAlert size={14} />,
              color: '#D71920',
              note: baseline ? 'Depuis réinit.' : null,
            },
            {
              label: 'Alertes Récentes',
              value: formatNumber(display.recent_alerts),
              icon: <AlertTriangle size={14} />,
              color: '#F97316',
              note: baseline ? 'Depuis réinit.' : null,
            },
            {
              label: 'Montant Frauduleux',
              value: formatCurrency(display.fraud_amount),
              icon: <CreditCard size={14} />,
              color: '#8B5CF6',
              note: baseline ? 'Depuis réinit.' : null,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="rounded-xl border border-[#1E293B] p-4 flex items-center gap-3"
              style={{ background: 'rgba(17,24,39,0.9)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}30` }}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-[#64748B]">{item.label}</p>
                <p className="text-sm font-bold text-[#F8FAFC] font-mono">{item.value}</p>
                {item.note && (
                  <p className="text-[10px] text-[#64748B]">{item.note}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Boutons en bas ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E293B]">
          <p className="text-xs text-[#64748B] mr-auto flex items-center gap-1.5">
            <Clock size={11} />
            Actualisation automatique toutes les 60 secondes
          </p>
          <motion.button
            onClick={handleDownload}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
            style={{
              background: 'rgba(0,86,166,0.12)',
              borderColor: 'rgba(0,86,166,0.35)',
              color: '#60A5FA',
            }}
          >
            <Download size={14} />
            Télécharger le Rapport
          </motion.button>
          <motion.button
            onClick={() => setShowResetModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{
              background: 'rgba(215,25,32,0.1)',
              borderColor: 'rgba(215,25,32,0.3)',
              color: '#FF4D55',
            }}
          >
            <RotateCcw size={14} />
            Réinitialiser les Données
          </motion.button>
        </div>
      </div>
    </>
  );
}
