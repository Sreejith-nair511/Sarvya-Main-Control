import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-accent-emerald';
  if (score >= 50) return 'text-accent-amber';
  return 'text-accent-rose';
}

export function scoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-500/20 text-emerald-400';
  if (score >= 50) return 'bg-amber-500/20 text-amber-400';
  return 'bg-rose-500/20 text-rose-400';
}

export function difficultyColor(d: string): string {
  const map: Record<string, string> = {
    'very-easy': 'text-emerald-400',
    'easy':      'text-green-400',
    'medium':    'text-amber-400',
    'hard':      'text-orange-400',
    'very-hard': 'text-rose-400',
  };
  return map[d] || 'text-slate-400';
}

export function difficultyBadge(d: string): string {
  const map: Record<string, string> = {
    'very-easy': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'easy':      'bg-green-500/20 text-green-400 border border-green-500/30',
    'medium':    'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    'hard':      'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'very-hard': 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  };
  return map[d] || 'bg-slate-500/20 text-slate-400';
}

export function cognitiveStateColor(state: string): string {
  const map: Record<string, string> = {
    'focused':        'text-emerald-400',
    'optimal':        'text-brand-400',
    'distracted':     'text-amber-400',
    'low-engagement': 'text-orange-400',
    'overloaded':     'text-rose-400',
  };
  return map[state] || 'text-slate-400';
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
