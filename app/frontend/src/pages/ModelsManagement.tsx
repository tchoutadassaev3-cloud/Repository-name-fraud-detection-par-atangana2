import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Upload, CheckCircle, AlertCircle, RefreshCw,
  Calendar, Tag, Cpu, BarChart2, UploadCloud, X, FileCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { modelsService, MLModel } from '../services/modelsService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatBytes, formatPercent } from '../utils/formatters';

const MODEL_TYPES: Record<string, string> = {
  random_forest: 'Forêt Aléatoire',
  gradient_boosting: 'Gradient Boosting',
  neural_network: 'Réseau de Neurones',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  logistic_regression: 'Régression Logistique',
};

export default function ModelsManagement() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('1.0.0');
  const [modelType, setModelType] = useState('random_forest');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await modelsService.getModels();
      setModels(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Impossible de charger les modèles');
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    if (!modelName) {
      setModelName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }
    if (!modelName) {
      toast.error('Veuillez entrer un nom de modèle');
      return;
    }

    setUploading(true);
    try {
      await modelsService.uploadModel(uploadFile, { name: modelName, version: modelVersion, type: modelType });
      toast.success('Modèle téléversé avec succès !');
      setUploadFile(null);
      setModelName('');
      setModelVersion('1.0.0');
      await fetchModels();
    } catch {
      toast.error('Échec du téléversement. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full bg-[#1E293B] border border-[#2D3748] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] transition-all";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Gestion des Modèles IA</h2>
          <p className="text-sm text-[#64748B]">Gérer et déployer les modèles de détection de fraude</p>
        </div>
        <button
          onClick={fetchModels}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] transition-all"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panneau téléversement */}
        <div className="xl:col-span-1">
          <div
            className="rounded-xl border border-[#1E293B] p-5 space-y-4"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-[#1E293B]">
              <div className="w-10 h-10 rounded-xl bg-[#003E7E]/20 border border-[#003E7E]/30 flex items-center justify-center">
                <UploadCloud size={18} className="text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Téléverser un Modèle</h3>
                <p className="text-xs text-[#64748B]">.pkl, .joblib, .h5 acceptés</p>
              </div>
            </div>

            {/* Zone de dépôt */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200"
              style={{
                borderColor: dragActive ? '#0056A6' : uploadFile ? '#10B981' : '#2D3748',
                background: dragActive ? 'rgba(0,86,166,0.08)' : uploadFile ? 'rgba(16,185,129,0.06)' : 'transparent',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pkl,.joblib,.h5,.pt,.onnx,.json,.bin"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              {uploadFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                    <FileCode size={22} className="text-[#34D399]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#F8FAFC]">{uploadFile.name}</p>
                    <p className="text-xs text-[#64748B]">{formatBytes(uploadFile.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadFile(null); setModelName(''); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1E293B] hover:bg-[#D71920]/20 flex items-center justify-center text-[#64748B] hover:text-[#FF4D55] transition-all"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#1A2234] flex items-center justify-center">
                    <Upload size={22} className="text-[#64748B]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#94A3B8]">Déposer le fichier ici</p>
                    <p className="text-xs text-[#64748B]">ou cliquer pour parcourir</p>
                  </div>
                </>
              )}
            </div>

            {/* Métadonnées */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Nom du Modèle</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="ex. DetecteurFraude_v2"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Version</label>
                <input
                  type="text"
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                  placeholder="ex. 1.0.0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Type de Modèle</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  {Object.entries(MODEL_TYPES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              onClick={handleUpload}
              disabled={uploading || !uploadFile}
              whileHover={{ scale: uploading || !uploadFile ? 1 : 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #003E7E, #0056A6)' }}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Téléversement...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UploadCloud size={15} />
                  Téléverser le Modèle
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Liste des modèles */}
        <div className="xl:col-span-2">
          <div
            className="rounded-xl border border-[#1E293B] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
          >
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Modèles Déployés ({models.length})</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs text-[#10B981]">Moteur IA Actif</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="md" />
              </div>
            ) : models.length === 0 ? (
              <EmptyState
                title="Aucun modèle déployé"
                description="Téléversez votre premier modèle via le panneau de gauche."
                icon={<Brain size={24} />}
              />
            ) : (
              <div className="divide-y divide-[#1E293B]">
                <AnimatePresence>
                  {models.map((model, i) => (
                    <motion.div
                      key={model.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-4 hover:bg-[#1A2234]/40 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#003E7E]/20 border border-[#003E7E]/30 flex items-center justify-center shrink-0">
                          <Brain size={16} className="text-[#60A5FA]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-semibold text-[#F8FAFC]">{model.name}</h4>
                            <span className="text-xs font-mono text-[#64748B]">v{model.version}</span>
                            <StatusBadge status={model.status || (model.is_active ? 'active' : 'inactive')} size="sm" />
                            {model.is_active && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/25">
                                ACTIF
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-[#64748B] mb-3">
                            <span className="flex items-center gap-1">
                              <Cpu size={11} />
                              {MODEL_TYPES[model.type || ''] || model.type?.replace(/_/g, ' ')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(model.upload_date || model.created_at || '')}
                            </span>
                            {model.file_size && (
                              <span className="flex items-center gap-1">
                                <Tag size={11} />
                                {formatBytes(model.file_size)}
                              </span>
                            )}
                          </div>

                          {/* Métriques */}
                          {(model.accuracy || model.precision || model.recall || model.f1_score) && (
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: 'Précision', value: model.accuracy, icon: CheckCircle, color: '#10B981' },
                                { label: 'Précis.', value: model.precision, icon: BarChart2, color: '#3B82F6' },
                                { label: 'Rappel', value: model.recall, icon: AlertCircle, color: '#F59E0B' },
                                { label: 'F1', value: model.f1_score, icon: Brain, color: '#8B5CF6' },
                              ].map(({ label, value, color }) => value != null ? (
                                <div key={label} className="rounded-lg bg-[#0B1220] p-2 text-center border border-[#1E293B]">
                                  <p className="text-[10px] text-[#64748B] mb-0.5">{label}</p>
                                  <p className="text-xs font-bold font-mono" style={{ color }}>
                                    {formatPercent((value || 0) * 100, 1)}
                                  </p>
                                </div>
                              ) : null)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
