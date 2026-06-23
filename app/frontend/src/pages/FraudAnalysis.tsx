import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Brain, AlertTriangle, CheckCircle,
  XCircle, Loader2, MapPin, CreditCard, User, Building,
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
                  borderColor: result.is_fraud ? '#D71920' : '#10B981',
                  background: result.is_fraud
                    ? 'linear-gradient(135deg, rgba(215,25,32,0.08) 0%, rgba(17,24,39,0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(17,24,39,0.95) 100%)',
                }}
              >
                {/* En-tête résultat */}
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{
                    borderColor: result.is_fraud ? '#D71920' : '#10B981',
                    background: result.is_fraud ? 'rgba(215,25,32,0.15)' : 'rgba(16,185,129,0.12)',
                  }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.is_fraud ? 'bg-[#D71920]/20' : 'bg-[#10B981]/20'}`}>
                    {result.is_fraud
                      ? <XCircle size={20} className="text-[#FF4D55]" />
                      : <CheckCircle size={20} className="text-[#34D399]" />
                    }
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#F8FAFC]">
                      {result.is_fraud ? 'FRAUDE DÉTECTÉE' : 'TRANSACTION LÉGITIME'}
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
                      <span className="text-lg font-bold font-mono" style={{ color: result.is_fraud ? '#FF4D55' : '#34D399' }}>
                        {formatPercent(probabilityPercent)}
                      </span>
                    </div>
                    <div className="h-3 bg-[#1E293B] rounded-full overflow-hidden">
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

                  {result.explanation && (
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
    </div>
  );
}
