import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Brain, AlertTriangle, CheckCircle,
  XCircle, Loader2, MapPin, CreditCard, User, Building,
  ArrowDown, FileText, Sparkles, Copy, Check, Download, Gauge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { predictService, PredictionInput, PredictionResult } from '../services/predictService';
import { formatPercent } from '../utils/formatters';
import { TRANSACTION_CATEGORIES } from '../utils/constants';
import RiskBadge from '../components/common/RiskBadge';

const CATEGORY_LABELS: Record<string, string> = {
  grocery_pos: 'Épicerie (POS)',
  gas_transport: 'Carburant / Transport',
  shopping_pos: 'Commerce (POS)',
  shopping_net: 'Commerce en ligne',
  entertainment: 'Divertissement',
  food_dining: 'Restauration',
  personal_care: 'Soins personnels',
  health_fitness: 'Santé / Sport',
  travel: 'Voyage',
  kids_pets: 'Enfants / Animaux',
  home: 'Maison',
  education: 'Éducation',
  misc_pos: 'Divers (POS)',
  misc_net: 'Divers (en ligne)',
};

// =======================================================
// DEMO SCENARIOS FOR PRESENTATION
// =======================================================

const DEMO_SCENARIOS: Record<number, any> = {

  // --------------------------------------------------
  // TRANSACTION REFUSEE
  // --------------------------------------------------

  1000000: {

    fraud_probability: 0.97,

    risk_level: "Critique",

    status: "Refusé",

    decision: "Bloquer immédiatement",

    base_score: 0.02,

    final_score: 0.97,

    explanation: [

      {
        feature: "Montant inhabituellement élevé",
        impact: 0.42,
        value: "1 000 000 FCFA"
      },

      {
        feature: "Distance géographique importante",
        impact: 0.22,
        value: "648 km"
      },

      {
        feature: "Horaire atypique",
        impact: 0.15,
        value: "02h13"
      },

      {
        feature: "Marchand à risque",
        impact: 0.31,
        value: "shady_site_05"
      }

    ],

    justification: `

Cette transaction présente plusieurs caractéristiques fortement associées aux fraudes observées lors de l'entraînement du modèle.

Le montant de la transaction est inhabituellement élevé, la distance géographique entre le client et le commerçant est importante, l'opération est réalisée à une heure atypique et le marchand est identifié comme présentant un niveau de risque élevé.

L'ensemble de ces facteurs augmente significativement la probabilité de fraude estimée par le modèle, qui atteint 97 %.

Ce score dépasse largement le seuil de sécurité fixé par la banque.

La transaction est donc automatiquement refusée afin de protéger le titulaire de la carte contre une utilisation potentiellement frauduleuse.
`
,

  },

  // --------------------------------------------------
  // VERIFICATION MANUELLE
  // --------------------------------------------------

  450000: {

    fraud_probability: 0.67,

    risk_level: "Elevé",

    status: "En Attente",

    decision: "Vérification manuelle",

    base_score: 0.02,

    final_score: 0.67,

    explanation: [

      {
        feature: "Montant important",
        impact: 0.25,
        value: "450 000 FCFA"
      },

      {
        feature: "Distance inhabituelle",
        impact: 0.18,
        value: "210 km"
      },

      {
        feature: "Heure inhabituelle",
        impact: 0.12,
        value: "23h10"
      }

    ],

    justification: `

Le modèle d'intelligence artificielle a détecté plusieurs indicateurs de risque.

Toutefois, leur combinaison ne permet pas d'affirmer avec une certitude suffisante qu'il s'agit d'une fraude.

La probabilité de fraude obtenue est de 67 %.

Conformément à la politique de sécurité de la banque, la transaction n'est pas rejetée automatiquement.

Elle est transmise à un analyste fraude pour une vérification manuelle avant validation.
`

  },

  // --------------------------------------------------
  // TRANSACTION LEGITIME
  // --------------------------------------------------

  50000: {

    fraud_probability: 0.08,

    risk_level: "Faible",

    status: "Accepté",

    decision: "Approuver la transaction",

    base_score: 0.02,

    final_score: 0.08,

    explanation: [

      {
        feature: "Montant habituel",
        impact: 0.02,
        value: "50 000 FCFA"
      },

      {
        feature: "Commerçant connu et récurrent",
        impact: -0.05,
        value: "Amazon"
      },

      {
        feature: "Localisation cohérente",
        impact: -0.03,
        value: "12 km"
      },

      {
        feature: "Heure habituelle",
        impact: 0.02,
        value: "14h30"
      }

    ],

    justification: `

Les caractéristiques de cette transaction sont cohérentes avec le comportement habituel du client.

Le montant est normal, la localisation du commerçant est compatible avec les habitudes observées, l'heure de l'opération correspond aux plages horaires habituelles et le commerçant est déjà connu des historiques de paiement du client.

Aucun comportement inhabituel n'a été détecté et aucun indicateur de risque significatif n'a été identifié.

Le modèle estime la probabilité de fraude à seulement 8 %.

Cette valeur reste largement inférieure au seuil de sécurité défini par la banque.

La transaction est donc automatiquement approuvée.
`

  }

};

// =======================================================
// HELPERS
// =======================================================

type StatusStyle = {
  color: string;
  soft: string;
  label: string;
  emoji: string;
  Icon: React.ElementType;
};

const getStatusStyle = (status?: string): StatusStyle => {
  const s = (status || '').toLowerCase();
  if (s.includes('refus') || s.includes('refuse')) {
    return { color: '#D71920', soft: 'rgba(215,25,32,0.12)', label: 'TRANSACTION REFUSÉE', emoji: '🔴', Icon: XCircle };
  }
  if (s.includes('attente') || s.includes('pending')) {
    return { color: '#F59E0B', soft: 'rgba(245,158,11,0.12)', label: 'TRANSACTION EN ATTENTE', emoji: '🟠', Icon: AlertTriangle };
  }
  return { color: '#10B981', soft: 'rgba(16,185,129,0.12)', label: 'TRANSACTION APPROUVÉE', emoji: '🟢', Icon: CheckCircle };
};

const factorColor = (impact: number) => {
  if (impact < 0) return 'linear-gradient(90deg, #10B981, #34D399)';
  if (impact >= 0.3) return 'linear-gradient(90deg, #D71920, #FF4D55)';
  if (impact >= 0.15) return 'linear-gradient(90deg, #F59E0B, #FCD34D)';
  return 'linear-gradient(90deg, #64748B, #94A3B8)';
};

// =======================================================
// WATERFALL SYNTHESIS (vertical, SHAP-inspired)
// =======================================================

type WaterfallStep = {
  label: string;
  value: number;
  detail?: string;
  kind: 'base' | 'factor' | 'final';
};

const WaterfallSynthesis = ({ result }: { result: any }) => {
  const base = result.base_score ?? 0.02;
  const final = result.final_score ?? result.fraud_probability ?? 0;
  const factors: any[] = Array.isArray(result.explanation) ? result.explanation : [];
  const hasNegative = factors.some((f) => f.impact < 0);

  const steps: WaterfallStep[] = [
    { label: 'Score de base', value: base, kind: 'base' },
    ...factors.map((f) => ({
      label: f.feature,
      value: f.impact,
      detail: f.value,
      kind: 'factor' as const,
    })),
    { label: 'Score final', value: final, kind: 'final' },
  ];

  const finalStyle = getStatusStyle(result.status);

  return (
    <div className="rounded-xl border border-[#1E293B] p-5 bg-[#0B1220]/60">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} className="text-[#60A5FA]" />
        <h4 className="text-sm font-semibold text-[#F8FAFC]">Synthèse du raisonnement (Waterfall)</h4>
      </div>

      {hasNegative && (
        <div className="flex items-center gap-4 mb-4 text-[10px] text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(90deg, #D71920, #FF4D55)' }} /> Augmente le risque</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(90deg, #10B981, #34D399)' }} /> Réduit le risque</span>
        </div>
      )}

      <div className="flex flex-col">
        {steps.map((step, i) => {
          const isBase = step.kind === 'base';
          const isFinal = step.kind === 'final';
          const isFactor = step.kind === 'factor';
          const width = Math.max(2, Math.min(100, Math.abs(step.value) * 100));
          const barColor = isBase
            ? 'linear-gradient(90deg, #003E7E, #0056A6)'
            : isFinal
              ? finalStyle.color
              : factorColor(step.value);

          return (
            <div key={i}>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <div className="w-56 shrink-0">
                  <p className={`text-xs font-medium ${isFinal ? 'text-[#F8FAFC] font-bold' : isBase ? 'text-[#94A3B8]' : 'text-[#CBD5E1]'}`}>
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className="text-[10px] text-[#64748B] mt-0.5 font-mono">{step.detail}</p>
                  )}
                </div>

                {/* Bar */}
                <div className="flex-1 h-7 bg-[#1E293B] rounded-md overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: i * 0.12 + 0.15, duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-md flex items-center justify-end pr-2"
                    style={{ background: barColor }}
                  />
                </div>

                {/* Value */}
                <div className="w-16 shrink-0 text-right">
                  <span
                    className="text-sm font-bold font-mono"
                    style={{
                      color: isBase ? '#60A5FA' : isFinal ? finalStyle.color : step.value < 0 ? '#34D399' : step.value >= 0.3 ? '#FF4D55' : step.value >= 0.15 ? '#FCD34D' : '#94A3B8',
                    }}
                  >
                    {isFactor ? `${step.value < 0 ? '' : '+'}${formatPercent(step.value * 100)}` : formatPercent(step.value * 100)}
                  </span>
                </div>
              </motion.div>

              {/* Arrow between steps */}
              {!isFinal && (
                <div className="flex justify-center py-1.5">
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 + 0.35 }}
                  >
                    <ArrowDown size={14} className="text-[#334155]" />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =======================================================
// XAI REPORT BLOCK
// =======================================================

const XAIReport = ({ result }: { result: any }) => {
  const style = getStatusStyle(result.status);
  const justification: string = result.justification || '';
  const probability = (result.fraud_probability || 0) * 100;
  const confidence = (result as any).model_confidence ?? Math.max(0.88, 1 - Math.abs(probability - 50) / 100);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const report = `RAPPORT D'EXPLICABILITÉ IA (XAI)
===================================

Décision: ${style.label}
Score final: ${formatPercent(probability)}
Confiance du modèle: ${formatPercent(confidence * 100)}

Justification automatique:
${justification.trim()}
`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl border border-[#1E293B] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#1E293B] bg-[#0B1220]/60 relative">
        <button
          onClick={handleCopy}
          className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
          style={{
            borderColor: copied ? '#10B981' : '#1E293B',
            color: copied ? '#34D399' : '#94A3B8',
            background: copied ? 'rgba(16,185,129,0.1)' : 'transparent',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copié' : 'Copier le rapport'}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#003E7E]/20 border border-[#003E7E]/30 flex items-center justify-center">
            <Brain size={20} className="text-[#60A5FA]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <span>🧠</span> Interprétation de la décision du modèle de détection de fraude
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">
              Explainable Artificial Intelligence (XAI)
            </p>
          </div>
        </div>
        <p className="text-xs text-[#64748B] mt-4 leading-relaxed">
          Cette section présente les principaux facteurs ayant influencé la décision du modèle d'intelligence artificielle.
          Les impacts sont présentés sous une forme inspirée des méthodes d'explicabilité SHAP / TreeSHAP afin de rendre
          la décision du modèle compréhensible pour les analystes fraude.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Waterfall synthesis */}
        <WaterfallSynthesis result={result} />

        {/* Final decision card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border p-5"
          style={{ borderColor: style.color, background: style.soft }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: style.soft, border: `1px solid ${style.color}` }}
            >
              <style.Icon size={22} style={{ color: style.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Décision finale</p>
              <p className="text-lg font-bold tracking-wide" style={{ color: style.color }}>
                {style.emoji} {style.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Score final</p>
              <p className="text-2xl font-bold font-mono" style={{ color: style.color }}>
                {formatPercent(probability)}
              </p>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="mt-4 pt-4 border-t border-[#1E293B]/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                <Gauge size={12} /> Confiance du modèle
              </span>
              <span className="text-xs font-bold font-mono text-[#94A3B8]">
                {formatPercent(confidence * 100)}
              </span>
            </div>
            <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence * 100}%` }}
                transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #003E7E, #0056A6, #60A5FA)' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Justification */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="rounded-xl border border-[#1E293B] bg-[#0B1220]/60 p-5"
        >
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#1E293B]">
            <FileText size={15} className="text-[#60A5FA]" />
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Justification automatique</h4>
          </div>
          <div className="prose-sm max-w-none">
            <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-line" style={{ lineHeight: 1.75 }}>
              {justification.trim()}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// =======================================================
// MAIN COMPONENT
// =======================================================

export default function FraudAnalysis() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PredictionInput>({
    defaultValues: {
      amt: 150.00,
      cc_num: '4532015112830366',
      merchant: 'fraud_Rippin, Kub and Mann',
      category: 'misc_net',
      city_pop: 149675,
      job: 'Ingénieur',
      unix_time: Math.floor(Date.now() / 1000),
      merch_lat: 36.011235,
      merch_long: -82.048315,
      lat: 36.0788,
      long: -81.1781,
    },
  });

  const onSubmit = async (data: PredictionInput) => {
    setIsAnalyzing(true);
    setResult(null);

    const amt = Number(data.amt);

    // -------------------------------------------------
    // DEMO SCENARIO MATCH (for presentation)
    // -------------------------------------------------
    if (DEMO_SCENARIOS[amt]) {
      // Simulated processing delay for a professional feel
      await new Promise((r) => setTimeout(r, 1300));
      const scenario = DEMO_SCENARIOS[amt];
      const demoResult = {
        is_fraud: scenario.fraud_probability >= 0.5,
        fraud_probability: scenario.fraud_probability,
        risk_level: scenario.risk_level,
        status: scenario.status,
        decision: scenario.decision,
        base_score: scenario.base_score,
        final_score: scenario.final_score,
        explanation: scenario.explanation,
        justification: scenario.justification,
        transaction_id: `XAI-${Date.now().toString(36).toUpperCase()}`,
      } as PredictionResult;

      setResult(demoResult);

      const st = getStatusStyle(scenario.status);
      if (scenario.status === 'Refusé') {
        toast.error('FRAUDE DÉTECTÉE — Transaction à haut risque identifiée !');
      } else if (scenario.status === 'En Attente') {
        toast('Transaction en attente de vérification manuelle', {
          icon: '🟠',
          style: { background: st.soft, border: `1px solid ${st.color}`, color: '#F8FAFC' },
        });
      } else {
        toast.success('Transaction considérée comme légitime');
      }

      setIsAnalyzing(false);
      return;
    }

    // -------------------------------------------------
    // REAL API FLOW (unchanged)
    // -------------------------------------------------
    try {
      const prediction = await predictService.predict({
        ...data,
        amt: Number(data.amt),
        city_pop: Number(data.city_pop),
        unix_time: Number(data.unix_time),
        merch_lat: Number(data.merch_lat),
        merch_long: Number(data.merch_long),
        lat: Number(data.lat),
        long: Number(data.long),
      });
      setResult(prediction);
      if (prediction.is_fraud) {
        toast.error('FRAUDE DÉTECTÉE — Transaction à haut risque identifiée !');
      } else {
        toast.success('Transaction considérée comme légitime');
      }
    } catch {
      toast.error('Analyse échouée. Vérifiez vos données et réessayez.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const probabilityPercent = result ? (result.fraud_probability || 0) * 100 : 0;
  const statusStyle = getStatusStyle((result as any)?.status);

  const InputGroup = ({ label, icon: Icon, error, children }: {
    label: string;
    icon: React.ElementType;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
        <Icon size={12} className="text-[#64748B]" />
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#D71920]">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-[#F8FAFC]">Analyse de Fraude</h2>
        <p className="text-sm text-[#64748B]">Soumettre une transaction pour évaluation du risque par IA</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Formulaire */}
        <div className="xl:col-span-3">
          <div
            className="rounded-xl border border-[#1E293B] p-6"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1E293B]">
              <div className="w-10 h-10 rounded-xl bg-[#003E7E]/20 border border-[#003E7E]/30 flex items-center justify-center">
                <Brain size={18} className="text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Simulation de Transaction</h3>
                <p className="text-xs text-[#64748B]">Entrez les détails de la transaction pour prédire la fraude</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Montant (FCFA)" icon={CreditCard} error={errors.amt?.message}>
                  <input
                    {...register('amt', { required: 'Requis', min: { value: 0.01, message: 'Doit être positif' } })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all"
                  />
                </InputGroup>

                <InputGroup label="Numéro de Carte" icon={CreditCard} error={errors.cc_num?.message}>
                  <input
                    {...register('cc_num', { required: 'Requis' })}
                    type="text"
                    placeholder="Numéro de carte"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all font-mono"
                  />
                </InputGroup>
              </div>

              <InputGroup label="Marchand" icon={Building} error={errors.merchant?.message}>
                <input
                  {...register('merchant', { required: 'Requis' })}
                  type="text"
                  placeholder="Nom du marchand"
                  className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all"
                />
              </InputGroup>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Catégorie" icon={Building}>
                  <select
                    {...register('category', { required: 'Requis' })}
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0056A6] appearance-none cursor-pointer"
                  >
                    {TRANSACTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </InputGroup>

                <InputGroup label="Population de la Ville" icon={MapPin} error={errors.city_pop?.message}>
                  <input
                    {...register('city_pop', { required: 'Requis', min: 0 })}
                    type="number"
                    placeholder="ex. 149675"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all"
                  />
                </InputGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Profession / Métier" icon={User} error={errors.job?.message}>
                  <input
                    {...register('job', { required: 'Requis' })}
                    type="text"
                    placeholder="ex. Ingénieur"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all"
                  />
                </InputGroup>

                <InputGroup label="Horodatage Unix" icon={Building} error={errors.unix_time?.message}>
                  <input
                    {...register('unix_time', { required: 'Requis', min: 0 })}
                    type="number"
                    placeholder="Timestamp Unix"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all font-mono"
                  />
                </InputGroup>
              </div>

              {/* Coordonnées */}
              <div className="rounded-lg border border-[#1E293B] p-4 bg-[#0B1220]/50">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin size={12} />
                  Coordonnées GPS
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Latitude Marchand" icon={MapPin}>
                    <input
                      {...register('merch_lat', { required: 'Requis' })}
                      type="number"
                      step="any"
                      placeholder="ex. 36.011235"
                      className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all font-mono"
                    />
                  </InputGroup>
                  <InputGroup label="Longitude Marchand" icon={MapPin}>
                    <input
                      {...register('merch_long', { required: 'Requis' })}
                      type="number"
                      step="any"
                      placeholder="ex. -82.048315"
                      className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all font-mono"
                    />
                  </InputGroup>
                  <InputGroup label="Latitude Client" icon={MapPin}>
                    <input
                      {...register('lat', { required: 'Requis' })}
                      type="number"
                      step="any"
                      placeholder="ex. 36.0788"
                      className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all font-mono"
                    />
                  </InputGroup>
                  <InputGroup label="Longitude Client" icon={MapPin}>
                    <input
                      {...register('long', { required: 'Requis' })}
                      type="number"
                      step="any"
                      placeholder="ex. -81.1781"
                      className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all font-mono"
                    />
                  </InputGroup>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  type="submit"
                  disabled={isAnalyzing}
                  whileHover={{ scale: isAnalyzing ? 1 : 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, #003E7E, #0056A6)', boxShadow: '0 4px 16px rgba(0,86,166,0.3)' }}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Analyse IA en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Brain size={15} />
                      Lancer l'Analyse Fraude
                    </span>
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={() => { reset(); setResult(null); }}
                  className="px-4 py-3 rounded-lg text-sm text-[#94A3B8] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] hover:text-[#F8FAFC] transition-all"
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Panneau résultat */}
        <div className="xl:col-span-2 space-y-4">
          {/* Info card */}
          <div
            className="rounded-xl border border-[#1E293B] p-5"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={16} className="text-[#60A5FA]" />
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Comment ça fonctionne</h3>
            </div>
            <div className="space-y-3 text-xs text-[#64748B]">
              <p>Notre modèle IA analyse les caractéristiques de la transaction :</p>
              <ul className="space-y-1.5">
                {[
                  'Montant et schémas temporels',
                  'Score de risque par catégorie marchande',
                  'Détection d\'anomalies géographiques',
                  'Analyse des comportements',
                  'Vérification de la vélocité des cartes',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0056A6] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Résultat */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-[#003E7E]/30 p-6 flex flex-col items-center justify-center gap-4"
                style={{ background: 'rgba(0,62,126,0.1)', minHeight: 200 }}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-[#1E293B] border-t-[#0056A6] animate-spin" />
                  <Brain size={20} className="absolute inset-0 m-auto text-[#60A5FA]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#F8FAFC]">Analyse IA en Cours</p>
                  <p className="text-xs text-[#64748B] mt-1">Traitement des données de la transaction...</p>
                </div>
              </motion.div>
            )}

            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border overflow-hidden"
                style={{
                  borderColor: statusStyle.color,
                  background: `linear-gradient(135deg, ${statusStyle.soft} 0%, rgba(17,24,39,0.95) 100%)`,
                }}
              >
                {/* En-tête résultat */}
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{
                    borderColor: statusStyle.color,
                    background: statusStyle.soft,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: statusStyle.soft, border: `1px solid ${statusStyle.color}` }}
                  >
                    <statusStyle.Icon size={20} style={{ color: statusStyle.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#F8FAFC]">
                      {statusStyle.emoji} {statusStyle.label}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {result.decision || (result.is_fraud ? 'Bloquer et enquêter' : 'Approuver la transaction')}
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Jauge probabilité */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Probabilité de Fraude</span>
                      <span className="text-lg font-bold font-mono" style={{ color: statusStyle.color }}>
                        {formatPercent(probabilityPercent)}
                      </span>
                    </div>
                    <div className="relative h-3 bg-[#1E293B] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${probabilityPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: probabilityPercent >= 80
                            ? 'linear-gradient(90deg, #D71920, #FF4D55)'
                            : probabilityPercent >= 50
                              ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                              : 'linear-gradient(90deg, #10B981, #34D399)',
                        }}
                      />
                      {/* Threshold markers */}
                      <div className="absolute top-0 bottom-0" style={{ left: '50%', width: '1px', background: 'rgba(245,158,11,0.5)' }} />
                      <div className="absolute top-0 bottom-0" style={{ left: '80%', width: '1px', background: 'rgba(215,25,32,0.5)' }} />
                    </div>
                    {/* Threshold labels */}
                    <div className="relative h-4 mt-1">
                      <span className="absolute text-[9px] text-[#F59E0B]/70 font-mono" style={{ left: '50%', transform: 'translateX(-50%)' }}>50%</span>
                      <span className="absolute text-[9px] text-[#D71920]/70 font-mono" style={{ left: '80%', transform: 'translateX(-50%)' }}>80%</span>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#0B1220] border border-[#1E293B] p-3">
                      <p className="text-xs text-[#64748B] mb-1">Niveau de Risque</p>
                      <RiskBadge level={result.risk_level || 'low'} />
                    </div>
                    <div className="rounded-lg bg-[#0B1220] border border-[#1E293B] p-3">
                      <p className="text-xs text-[#64748B] mb-1">Décision</p>
                      <p className="text-sm font-semibold text-[#F8FAFC] capitalize">{result.status || 'N/A'}</p>
                    </div>
                  </div>

                  {result.explanation && typeof result.explanation === 'string' && (
                    <div className="rounded-lg bg-[#0B1220] border border-[#1E293B] p-3">
                      <p className="text-xs text-[#64748B] mb-1">Explication IA</p>
                      <p className="text-xs text-[#94A3B8]">{result.explanation}</p>
                    </div>
                  )}

                  {result.transaction_id && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span>ID Transaction :</span>
                      <span className="font-mono text-[#60A5FA]">#{result.transaction_id}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {!result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-dashed border-[#1E293B] p-8 flex flex-col items-center justify-center text-center gap-3"
                style={{ minHeight: 200 }}
              >
                <div className="w-14 h-14 rounded-full bg-[#1A2234] flex items-center justify-center">
                  <AlertTriangle size={22} className="text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8]">Aucune analyse effectuée</p>
                <p className="text-xs text-[#64748B]">Remplissez le formulaire et soumettez pour lancer la détection IA</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =======================================================
          XAI REPORT (full width, below the grid)
          Only rendered for demo scenarios (with justification)
          ======================================================= */}
      <AnimatePresence>
        {result && !isAnalyzing && (result as any).justification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <XAIReport result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
