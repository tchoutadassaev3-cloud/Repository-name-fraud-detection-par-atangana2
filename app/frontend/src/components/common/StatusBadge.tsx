interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const config: Record<string, { label: string; className: string }> = {

  // =========================
  // ACCEPTÉ
  // =========================

  approved: {
    label: 'Approuvée',
    className: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
  },

  accepted: {
    label: 'Acceptée',
    className: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
  },

  legitimate: {
    label: 'Légitime',
    className: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
  },

  valid: {
    label: 'Valide',
    className: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
  },

  // =========================
  // ATTENTE
  // =========================

  pending: {
    label: 'En attente',
    className: 'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/30'
  },

  processing: {
    label: 'En attente',
    className: 'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/30'
  },

  flagged: {
    label: 'Signalée',
    className: 'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/30'
  },

  investigating: {
    label: 'En Investigation',
    className: 'bg-[#F59E0B]/15 text-[#FCD34D] border-[#F59E0B]/30'
  },

  // =========================
  // FRAUDE / BLOQUÉ
  // =========================

  blocked: {
    label: 'Bloquée',
    className: 'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30'
  },

  fraud: {
    label: 'Fraude',
    className: 'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30'
  },

  rejected: {
    label: 'Refusée',
    className: 'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30'
  },

  refused: {
    label: 'Refusée',
    className: 'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30'
  },

  declined: {
    label: 'Refusée',
    className: 'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30'
  },

  // =========================
  // AUTRES
  // =========================

  reviewed: {
    label: 'Examinée',
    className: 'bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30'
  },

  active: {
    label: 'Actif',
    className: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
  },

  inactive: {
    label: 'Inactif',
    className: 'bg-[#64748B]/15 text-[#94A3B8] border-[#64748B]/30'
  },

  deployed: {
    label: 'Déployé',
    className: 'bg-[#0056A6]/15 text-[#60A5FA] border-[#0056A6]/30'
  },

  training: {
    label: 'Entraînement',
    className: 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30'
  },

  open: {
    label: 'Ouverte',
    className: 'bg-[#D71920]/15 text-[#FF4D55] border-[#D71920]/30'
  },

  resolved: {
    label: 'Résolue',
    className: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
  }
};

export default function StatusBadge({
  status,
  size = 'md'
}: StatusBadgeProps) {

  const key = status?.toLowerCase();

  const cfg =
    config[key] ||
    {
      label: status || 'Inconnu',
      className:
        'bg-[#64748B]/15 text-[#94A3B8] border-[#64748B]/30'
    };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${
        cfg.className
      } ${
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[10px]'
          : 'px-2 py-0.5 text-xs'
      }`}
    >
      {cfg.label}
    </span>
  );
}