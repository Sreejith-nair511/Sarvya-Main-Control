'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  label, value, sub, icon,
  color = 'text-brand-400',
  trend, trendValue, className,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn('card p-4 lg:p-5 flex flex-col gap-2 lg:gap-3', className)}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
          {label}
        </p>
        {icon && (
          <div className={cn('p-1.5 rounded-lg bg-surface-hover shrink-0', color)}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className={cn('text-xl lg:text-3xl font-bold tracking-tight', color)}>
          {value}
        </p>
        {sub && <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
      {trend && trendValue && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          trend === 'up' ? 'text-emerald-400' :
          trend === 'down' ? 'text-rose-400' : 'text-slate-400'
        )}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span className="truncate">{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}
