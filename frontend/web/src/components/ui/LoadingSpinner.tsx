import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="w-8 h-8 border-2 border-surface-border border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn('skeleton h-32 w-full', className)} />;
}
