interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ size = 'md', className = '', fullScreen = false }: LoadingSpinnerProps) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const borderMap = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' };

  const spinner = (
    <div
      className={`${sizeMap[size]} ${borderMap[size]} rounded-full border-[#1E293B] border-t-[#0056A6] animate-spin ${className}`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0B1220] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <img src="/assets/images/Logo_afg_bank.png" alt="AFG Bank" className="h-12 w-auto opacity-80 animate-pulse" />
          <div className="w-10 h-10 border-[3px] rounded-full border-[#1E293B] border-t-[#0056A6] animate-spin" />
          <p className="text-sm text-[#64748B]">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
