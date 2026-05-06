import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title, subtitle, icon,
  iconColor = 'from-brand-500 to-violet-500',
  actions, className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 lg:mb-8', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className={cn(
              'p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br shadow-glow-brand shrink-0',
              iconColor
            )}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg lg:text-2xl font-bold text-white tracking-tight leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs lg:text-sm text-slate-400 mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
