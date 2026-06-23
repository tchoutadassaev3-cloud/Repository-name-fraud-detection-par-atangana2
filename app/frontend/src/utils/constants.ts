// Configuration locale (développement)
export const API_BASE_URL = 'http://localhost:8000';
export const WS_URL = 'ws://localhost:8000/ws/alerts';

// Configuration production (à activer pour le déploiement)
// export const API_BASE_URL = 'https://repository-name-fraud-detection-par.onrender.com';
// export const WS_URL = 'wss://repository-name-fraud-detection-par.onrender.com/ws/alerts';

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const RISK_COLORS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#D71920',
};

export const RISK_BG: Record<string, string> = {
  low: 'rgba(16,185,129,0.15)',
  medium: 'rgba(245,158,11,0.15)',
  high: 'rgba(249,115,22,0.15)',
  critical: 'rgba(215,25,32,0.15)',
};

export const STATUS_COLORS: Record<string, string> = {
  approved: '#10B981',
  legitimate: '#10B981',
  flagged: '#F59E0B',
  blocked: '#D71920',
  fraud: '#D71920',
  pending: '#3B82F6',
  reviewed: '#94A3B8',
};

export const TRANSACTION_CATEGORIES = [
  'grocery_pos',
  'gas_transport',
  'shopping_pos',
  'shopping_net',
  'entertainment',
  'food_dining',
  'personal_care',
  'health_fitness',
  'travel',
  'kids_pets',
  'home',
  'education',
  'misc_pos',
  'misc_net',
];

export const CHART_COLORS = {
  primary: '#0056A6',
  secondary: '#22C55E',
  danger: '#D71920',
  warning: '#F59E0B',
  info: '#3B82F6',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  orange: '#F97316',
};
