import { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title = 'Aucune donnée disponible',
  description = 'Les données apparaîtront ici une fois disponibles.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-4 text-[#64748B]">
        {icon || <InboxIcon size={24} />}
      </div>
      <p className="text-[#F8FAFC] font-medium mb-1">{title}</p>
      <p className="text-sm text-[#64748B] max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
