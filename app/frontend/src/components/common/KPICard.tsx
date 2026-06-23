import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'teal';
  delay?: number;
  loading?: boolean;
}

const colorMap = {
  blue: {
    icon: 'bg-[#003E7E]/20 text-[#60A5FA] border-[#003E7E]/30',
    accent: '#0056A6',
    glow: 'rgba(0,86,166,0.15)',
    border: '#003E7E',
  },
  red: {
    icon: 'bg-[#D71920]/20 text-[#FF4D55] border-[#D71920]/30',
    accent: '#D71920',
    glow: 'rgba(215,25,32,0.15)',
    border: '#D71920',
  },
  green: {
    icon: 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30',
    accent: '#10B981',
    glow: 'rgba(16,185,129,0.15)',
    border: '#10B981',
  },
  yellow: {
    icon: 'bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/30',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.15)',
    border: '#F59E0B',
  },
  purple: {
    icon: 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/30',
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.15)',
    border: '#8B5CF6',
  },
  teal: {
    icon: 'bg-[#14B8A6]/20 text-[#2DD4BF] border-[#14B8A6]/30',
    accent: '#14B8A6',
    glow: 'rgba(20,184,166,0.15)',
    border: '#14B8A6',
  },
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  delay = 0,
  loading = false,
}: KPICardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-[#1E293B] rounded w-24" />
            <div className="w-10 h-10 rounded-lg bg-[#1E293B]" />
          </div>
          <div className="h-8 bg-[#1E293B] rounded w-32" />
          <div className="h-3 bg-[#1E293B] rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative rounded-xl border p-5 overflow-hidden group cursor-default"
      style={{
        background: `linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.98) 100%)`,
        borderColor: `${colors.border}30`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 0 60px ${colors.glow}`,
      }}
      whileHover={{
        y: -2,
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), inset 0 0 80px ${colors.glow}`,
        transition: { duration: 0.2 },
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{title}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <motion.p
          className="text-3xl font-bold text-[#F8FAFC] font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value}
        </motion.p>

        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  trend > 0 ? 'text-[#D71920]' : trend < 0 ? 'text-[#10B981]' : 'text-[#64748B]'
                }`}
              >
                {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
