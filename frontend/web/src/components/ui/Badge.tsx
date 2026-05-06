import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'slate';
  className?: string;
}

const VARIANTS = {
  brand:   'bg-brand-600/20 text-brand-300 border border-brand-600/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  amber:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  rose:    'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  violet:  'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  slate:   'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
  return (
    <span className={cn('badge', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
