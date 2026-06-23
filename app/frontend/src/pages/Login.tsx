import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, Shield, Activity, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';

interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

const DEMO_USERNAME = 'admin1';
const DEMO_PASSWORD = 'admin1';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Accès administrateur local (bypass API)
      if (data.username === DEMO_USERNAME && data.password === DEMO_PASSWORD) {
        loginDemo(data.username);
        toast.success('Connexion réussie — Bienvenue sur la plateforme AFG Bank');
        navigate('/dashboard');
        return;
      }

      // Authentification via l'API backend
      await login({ username: data.username, password: data.password });
      toast.success('Authentification réussie');
      navigate('/dashboard');
    } catch (err: unknown) {
      setIsLoading(false);

      // Gestion des erreurs réseau (serveur indisponible)
      const axiosErr = err as { code?: string; message?: string; response?: { status?: number; data?: { detail?: string } } };

      if (axiosErr.code === 'ERR_NETWORK' || axiosErr.message?.includes('Network Error')) {
        toast.error('Serveur indisponible. Veuillez contacter l\'administrateur.');
        return;
      }

      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
        toast.error('Délai de connexion dépassé. Veuillez réessayer.');
        return;
      }

      // Erreurs HTTP spécifiques
      if (axiosErr.response?.status === 401) {
        toast.error('Nom d\'utilisateur ou mot de passe incorrect.');
        return;
      }

      if (axiosErr.response?.status === 422) {
        toast.error('Format d\'identifiants invalide.');
        return;
      }

      // Message d'erreur du backend ou message par défaut
      const backendMessage = axiosErr.response?.data?.detail;
      if (backendMessage) {
        toast.error(backendMessage);
        return;
      }

      // Fallback générique
      toast.error('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '10px',
          },
        }}
      />

      {/* Panneau gauche — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-10"
        style={{ background: 'linear-gradient(135deg, #003E7E 0%, #001E4A 50%, #0B1220 100%)' }}
      >
        {/* Grille de fond */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #fff 39px, #fff 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, #fff 39px, #fff 40px)`,
          }}
        />

        {/* Cercles décoratifs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#0056A6]/20 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full bg-[#D71920]/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <motion.img
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            src="/assets/images/Logo_afg_bank.png"
            alt="AFG Bank"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Texte principal */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight">
              Détection de Fraude
              <br />
              <span className="text-[#60A5FA]">par Intelligence Artificielle</span>
            </h1>
            <p className="text-[#94A3B8] mt-3 text-base leading-relaxed">
              Centre des Opérations de Sécurité — Surveillance en temps réel propulsée par l'IA.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            {[
              { icon: Shield, text: 'Détection de fraude en temps réel par IA' },
              { icon: Activity, text: 'Surveillance des transactions par WebSocket' },
              { icon: AlertTriangle, text: 'Score de risque intelligent et système d\'alertes' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-[#94A3B8]">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-[#60A5FA]" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-2 text-[#64748B] text-xs"
        >
          <Shield size={12} />
          <span>AFG Bank Atlantic Group &copy; {new Date().getFullYear()} &mdash; Plateforme SOC v2.0</span>
        </motion.div>
      </div>

      {/* Panneau droit — Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/assets/images/Logo_afg_bank.png" alt="AFG Bank" className="h-12 w-auto object-contain" />
          </div>

          {/* Carte principale */}
          <div
            className="rounded-2xl p-8 border"
            style={{
              background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)',
              borderColor: '#1E293B',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F8FAFC]">Connexion Sécurisée</h2>
              <p className="text-sm text-[#64748B] mt-1">Portail d'authentification — Centre SOC</p>
            </div>

            {/* Avertissement sécurité */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#003E7E]/15 border border-[#003E7E]/25 mb-6">
              <Shield size={13} className="text-[#60A5FA] shrink-0" />
              <span className="text-xs text-[#94A3B8]">
                Plateforme bancaire sécurisée. Tout accès non autorisé est strictement interdit.
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Nom d'utilisateur */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                    <User size={15} />
                  </div>
                  <input
                    {...register('username', { required: 'Nom d\'utilisateur requis' })}
                    type="text"
                    placeholder="Entrez votre identifiant"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg pl-9 pr-4 py-3 text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] focus:ring-1 focus:ring-[#0056A6]/30 transition-all"
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-[#D71920]">{errors.username.message}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                    <Lock size={15} />
                  </div>
                  <input
                    {...register('password', { required: 'Mot de passe requis' })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe"
                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-lg pl-9 pr-10 py-3 text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:border-[#0056A6] focus:ring-1 focus:ring-[#0056A6]/30 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#D71920]">{errors.password.message}</p>
                )}
              </div>

              {/* Rester connecté */}
              <div className="flex items-center gap-2">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-[#2D3748] bg-[#1E293B] accent-[#0056A6]"
                />
                <label htmlFor="rememberMe" className="text-sm text-[#94A3B8] cursor-pointer">
                  Rester connecté
                </label>
              </div>

              {/* Bouton connexion */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #003E7E 0%, #0056A6 100%)',
                  boxShadow: '0 4px 20px rgba(0,86,166,0.3)',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authentification en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield size={15} />
                    Se Connecter
                  </span>
                )}
              </motion.button>
            </form>

            {/* Pied de formulaire */}
            <div className="mt-6 pt-4 border-t border-[#1E293B]">
              <p className="text-center text-xs text-[#64748B]">
                Pour tout problème d'accès, contactez l'équipe Sécurité Informatique
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-[#64748B] mt-4">
            AFG Bank &mdash; Atlantic Group &copy; {new Date().getFullYear()}. Tous droits réservés.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
