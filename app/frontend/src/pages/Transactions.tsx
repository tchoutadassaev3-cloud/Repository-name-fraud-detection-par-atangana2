import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Download, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionsService, Transaction } from '../services/transactionsService';
import RiskBadge from '../components/common/RiskBadge';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate, maskCardNumber, truncate, getRiskLevel } from '../utils/formatters';

type SortKey = keyof Transaction;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionsService.getTransactions({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        risk_level: riskFilter || undefined,
      });
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Impossible de charger les transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, riskFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-[#2D3748]" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[#60A5FA]" />
      : <ChevronDown size={12} className="text-[#60A5FA]" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Transactions</h2>
          <p className="text-sm text-[#64748B]">
            {total > 0 ? `${total.toLocaleString('fr-FR')} transactions au total` : 'Historique des transactions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] transition-all"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] transition-all">
            <Download size={14} />
            Exporter
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Rechercher par marchand, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#1A2234] border border-[#1E293B] rounded-lg pl-8 pr-4 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all"
          />
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1A2234] border border-[#1E293B] rounded-lg pl-8 pr-8 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0056A6] appearance-none cursor-pointer"
          >
            <option value="">Tous les Statuts</option>
            <option value="approved">Approuvée</option>
            <option value="flagged">Signalée</option>
            <option value="blocked">Bloquée</option>
            <option value="pending">En attente</option>
          </select>
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            className="bg-[#1A2234] border border-[#1E293B] rounded-lg pl-8 pr-8 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0056A6] appearance-none cursor-pointer"
          >
            <option value="">Tous les Niveaux</option>
            <option value="low">Faible</option>
            <option value="medium">Moyen</option>
            <option value="high">Élevé</option>
            <option value="critical">Critique</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-[#1E293B] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E293B]">
                {[
                  { key: 'id' as SortKey, label: 'ID Transaction', w: 'w-36' },
                  { key: 'amount' as SortKey, label: 'Montant', w: 'w-28' },
                  { key: 'merchant' as SortKey, label: 'Marchand', w: '' },
                  { key: 'category' as SortKey, label: 'Catégorie', w: 'w-32' },
                  { key: 'fraud_score' as SortKey, label: 'Score Fraude', w: 'w-32' },
                  { key: 'risk_level' as SortKey, label: 'Risque', w: 'w-28' },
                  { key: 'status' as SortKey, label: 'Statut', w: 'w-28' },
                  { key: 'date' as SortKey, label: 'Date', w: 'w-36' },
                ].map(({ key, label, w }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider py-3 px-4 cursor-pointer hover:text-[#94A3B8] transition-colors ${w}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <LoadingSpinner size="md" className="mx-auto" />
                  </td>
                </tr>
              ) : sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Aucune transaction trouvée"
                      description="Essayez d'ajuster vos critères de recherche ou de filtrage."
                    />
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx, i) => {
                  const riskLevel = tx.risk_level || getRiskLevel(tx.fraud_score || 0);
                  const isFraud = tx.is_fraud || tx.status === 'fraud' || tx.status === 'blocked';
                  return (
                    <motion.tr
                      key={tx.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-[#1E293B]/50 hover:bg-[#1A2234]/50 transition-colors ${
                        isFraud ? 'border-l-2 border-l-[#D71920]' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-[#60A5FA]">
                          #{String(tx.transaction_id || tx.id || '').slice(0, 10)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-sm text-[#F8FAFC]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-[#F8FAFC]">{truncate(tx.merchant || 'Inconnu', 24)}</p>
                          {tx.card_number && (
                            <p className="text-xs text-[#64748B] font-mono">{maskCardNumber(tx.card_number)}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-[#94A3B8] capitalize">
                          {(tx.category || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#1E293B] max-w-[60px]">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${(tx.fraud_score || 0) * 100}%`,
                                background: tx.fraud_score >= 0.8 ? '#D71920' : tx.fraud_score >= 0.5 ? '#F59E0B' : '#10B981',
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-[#94A3B8]">
                            {((tx.fraud_score || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge level={riskLevel} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={tx.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-xs text-[#64748B]">
                        {formatDate(tx.date || tx.created_at || '')}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E293B]">
            <span className="text-xs text-[#64748B]">
              Affichage de {(page - 1) * PAGE_SIZE + 1} à {Math.min(page * PAGE_SIZE, total)} sur {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2234] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                      p === page
                        ? 'bg-[#003E7E] text-white'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2234]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2234] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
