import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface RiskBadgeProps {
  level: string;
  score?: number;
  size?: 'sm' | 'md';
}

const config = {

  // =========================
  // FAIBLE
  // =========================

  low: {
    label: 'FAIBLE',
    className:
      'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30',
    icon: CheckCircle
  },

  faible: {
    label: 'FAIBLE',
    className:
      'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30',
    icon: CheckCircle
  },

  // =========================
  // MOYEN
  // =========================

  medium: {
    label: 'MOYEN',
    className:
      'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/30',
    icon: AlertTriangle
  },

  moyen: {
    label: 'MOYEN',
    className:
      'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/30',
    icon: AlertTriangle
  },

  // =========================
  // ÉLEVÉ
  // =========================

  high: {
    label: 'ÉLEVÉ',
    className:
      'bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/30',
    icon: AlertCircle
  },

  élevé: {
    label: 'ÉLEVÉ',
    className:
      'bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/30',
    icon: AlertCircle
  },

  eleve: {
    label: 'ÉLEVÉ',
    className:
      'bg-[#F97316]/15 text-[#FB923C] border-[#F97316]/30',
    icon: AlertCircle
  },

  // =========================
  // CRITIQUE
  // =========================

  critical: {
    label: 'CRITIQUE',
    className:
      'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30',
    icon: XCircle
  },

  critique: {
    label: 'CRITIQUE',
    className:
      'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30',
    icon: XCircle
  }
};

export default function RiskBadge({
  level,
  score,
  size = 'md'
}: RiskBadgeProps) {

  const key = level?.toLowerCase();

  const cfg =
    config[key as keyof typeof config] ||
    config.low;

  const Icon = cfg.icon;

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-semibold ${
        cfg.className
      } ${
        isSmall
          ? 'px-1.5 py-0.5 text-[10px]'
          : 'px-2 py-0.5 text-xs'
      }`}
    >
      <Icon size={isSmall ? 10 : 12} />

      {cfg.label}

      {score !== undefined && !isSmall && (
        <span className="ml-0.5 opacity-70">
          ({(score * 100).toFixed(0)}%)
        </span>
      )}
    </span>
  );
}