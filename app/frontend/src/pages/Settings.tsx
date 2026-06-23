import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Shield, Bell, Database,
  Monitor, Key, Globe, RefreshCw, Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const sections = [
  {
    id: 'security',
    icon: Shield,
    title: 'Sécurité',
    color: '#0056A6',
    settings: [
      { label: 'Authentification à Deux Facteurs', description: 'Ajouter une couche de sécurité supplémentaire', type: 'toggle', defaultValue: true },
      { label: 'Délai d\'Expiration de Session', description: 'Déconnexion automatique après inactivité', type: 'select', options: ['15 minutes', '30 minutes', '1 heure', '4 heures'], defaultValue: '30 minutes' },
      { label: 'Liste Blanche IP', description: 'Restreindre l\'accès à des adresses IP spécifiques', type: 'toggle', defaultValue: false },
    ],
  },
  {
    id: 'alerts',
    icon: Bell,
    title: 'Notifications d\'Alertes',
    color: '#D71920',
    settings: [
      { label: 'Emails d\'Alertes Critiques', description: 'Envoyer un email pour les alertes de fraude critiques', type: 'toggle', defaultValue: true },
      { label: 'Notifications Push en Temps Réel', description: 'Notifications navigateur pour les événements de fraude', type: 'toggle', defaultValue: true },
      { label: 'Seuil d\'Alerte', description: 'Score de fraude minimum pour déclencher une alerte', type: 'select', options: ['50%', '60%', '70%', '80%', '90%'], defaultValue: '70%' },
    ],
  },
  {
    id: 'monitoring',
    icon: Monitor,
    title: 'Surveillance',
    color: '#10B981',
    settings: [
      { label: 'Intervalle d\'Actualisation', description: 'Fréquence de mise à jour du tableau de bord', type: 'select', options: ['30 secondes', '1 minute', '5 minutes', '10 minutes'], defaultValue: '1 minute' },
      { label: 'WebSocket Temps Réel', description: 'Activer la connexion WebSocket d\'alertes en direct', type: 'toggle', defaultValue: true },
      { label: 'Métriques de Performance', description: 'Afficher les statistiques détaillées des modèles IA', type: 'toggle', defaultValue: true },
    ],
  },
  {
    id: 'api',
    icon: Database,
    title: 'Configuration API',
    color: '#F59E0B',
    settings: [
      { label: 'URL de l\'API', description: 'URL de base de l\'API backend', type: 'text', defaultValue: 'https://repository-name-fraud-detection-par.onrender.com' },
      { label: 'Délai de Requête', description: 'Délai d\'expiration des requêtes API en secondes', type: 'select', options: ['15s', '30s', '60s', '120s'], defaultValue: '30s' },
      { label: 'Mode Débogage', description: 'Activer la journalisation détaillée des requêtes API', type: 'toggle', defaultValue: false },
    ],
  },
];

function SettingItem({ setting }: { setting: (typeof sections)[0]['settings'][0] }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1E293B] last:border-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-[#F8FAFC]">{setting.label}</p>
        <p className="text-xs text-[#64748B] mt-0.5">{setting.description}</p>
      </div>
      <div className="shrink-0">
        {setting.type === 'toggle' && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={setting.defaultValue as boolean}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0056A6]" />
          </label>
        )}
        {setting.type === 'select' && (
          <select
            defaultValue={setting.defaultValue as string}
            className="bg-[#1E293B] border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#0056A6] appearance-none cursor-pointer"
          >
            {setting.options?.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        )}
        {setting.type === 'text' && (
          <input
            type="text"
            defaultValue={setting.defaultValue as string}
            className="bg-[#1E293B] border border-[#2D3748] rounded-lg px-2 py-1.5 text-xs text-[#F8FAFC] w-64 focus:outline-none focus:border-[#0056A6] font-mono"
          />
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[#F8FAFC]">Paramètres</h2>
        <p className="text-sm text-[#64748B]">Configuration et préférences de la plateforme</p>
      </div>

      {/* Carte profil */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[#1E293B] p-5"
        style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#003E7E] to-[#0056A6] flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F8FAFC]">{user?.username || 'Analyste'}</h3>
            <p className="text-sm text-[#64748B]">{user?.role || 'Analyste SOC'} &bull; AFG Bank Atlantic Group</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield size={11} className="text-[#10B981]" />
              <span className="text-xs text-[#10B981]">Authentifié</span>
            </div>
          </div>
          <div className="ml-auto">
            <img src="/assets/images/Logo_afg_bank.png" alt="AFG Bank" className="h-10 w-auto opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Sections paramètres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, si) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
              className="rounded-xl border border-[#1E293B] p-5"
              style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#1E293B]">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${section.color}20`, color: section.color, border: `1px solid ${section.color}30` }}
                >
                  <Icon size={16} />
                </div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">{section.title}</h3>
              </div>
              <div>
                {section.settings.map((setting) => (
                  <SettingItem key={setting.label} setting={setting} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toast.success('Paramètres enregistrés avec succès')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #003E7E, #0056A6)' }}
        >
          <Save size={15} />
          Enregistrer les Paramètres
        </motion.button>
        <button
          onClick={() => toast.success('Paramètres réinitialisés par défaut')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1A2234] border border-[#1E293B] hover:border-[#2D3748] transition-all"
        >
          <RefreshCw size={15} />
          Réinitialiser
        </button>
      </div>

      {/* Informations système */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-[#1E293B] p-5"
        style={{ background: 'rgba(17,24,39,0.8)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon size={15} className="text-[#64748B]" />
          <h3 className="text-sm font-semibold text-[#94A3B8]">Informations Système</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { label: 'Plateforme', value: 'AFG Bank SOC v2.0', icon: Shield },
            { label: 'Moteur IA', value: 'ML Fraud Detector', icon: Database },
            { label: 'Statut API', value: 'Connecté', icon: Globe },
            { label: 'Licence', value: 'Entreprise', icon: Key },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={12} className="text-[#64748B]" />
              <div>
                <p className="text-[#64748B]">{label}</p>
                <p className="text-[#F8FAFC] font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
