'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Accessibility, Eye, Type, Volume2, Monitor,
  Zap, RotateCcw, Check, ChevronRight,
} from 'lucide-react';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Mode = 'standard' | 'high-contrast' | 'large-text' | 'voice-first' | 'simplified';

const MODES: { id: Mode; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { id: 'standard',      label: 'Standard',       desc: 'Default SARVYA experience',                    icon: Monitor,     color: 'text-brand-400' },
  { id: 'high-contrast', label: 'High Contrast',  desc: 'Maximum contrast for visual impairments',      icon: Eye,         color: 'text-yellow-400' },
  { id: 'large-text',    label: 'Large Text',     desc: 'Enlarged text for easier reading',             icon: Type,        color: 'text-cyan-400' },
  { id: 'voice-first',   label: 'Voice First',    desc: 'Audio-primary with voice navigation',          icon: Volume2,     color: 'text-emerald-400' },
  { id: 'simplified',    label: 'Simplified',     desc: 'Reduced complexity for cognitive accessibility',icon: Zap,         color: 'text-violet-400' },
];

const EXPLANATION_STYLES = [
  { id: 'story',        label: 'Story',         desc: 'Narrative format — great for beginners' },
  { id: 'step-by-step', label: 'Step-by-Step',  desc: 'Sequential instructions — clear and structured' },
  { id: 'diagram',      label: 'Diagram',       desc: 'Visual representation — spatial learners' },
  { id: 'example',      label: 'Example',       desc: 'Concrete examples — practical learners' },
];

const COMM_STYLES = [
  { id: 'beginner',     label: 'Beginner',      desc: 'Simple words, slow pace, lots of encouragement' },
  { id: 'intermediate', label: 'Intermediate',  desc: 'Clear explanations with examples' },
  { id: 'advanced',     label: 'Advanced',      desc: 'Technical, concise, assumes prior knowledge' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-400',
        checked ? 'bg-brand-600' : 'bg-surface-border'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  );
}

export function AccessibilityPage() {
  const { userId, accessibility, setAccessibility } = useSarvyaStore();
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.accessibility.update(userId, accessibility);
      toast.success('Accessibility preferences saved');
    } catch {
      toast.success('Preferences saved locally');
    } finally { setSaving(false); }
  }

  async function reset() {
    try {
      await api.accessibility.reset(userId);
    } catch {}
    setAccessibility({
      mode: 'standard', highContrast: false, largeText: false,
      voiceNavigation: false, screenReaderOptimized: false, reducedMotion: false,
      fontSize: 16, preferredExplanationStyle: 'step-by-step',
      communicationStyle: 'intermediate', audioLearning: false, simplifiedText: false,
    });
    toast.success('Reset to defaults');
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Accessibility Settings"
        subtitle="Customize SARVYA to match your needs — every setting adapts the entire ecosystem"
        icon={<Accessibility className="w-6 h-6 text-white" />}
        iconColor="from-rose-500 to-pink-500"
        actions={
          <div className="flex gap-2">
            <button onClick={reset} className="btn-secondary">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        }
      />

      {/* Active mode preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="card p-4 mb-6 flex items-center gap-3 border border-brand-600/30 bg-brand-600/5"
      >
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
        <p className="text-sm text-slate-300">
          Active mode: <span className="text-brand-300 font-semibold capitalize">{accessibility.mode}</span>
          {accessibility.highContrast && ' · High Contrast'}
          {accessibility.largeText && ' · Large Text'}
          {accessibility.reducedMotion && ' · Reduced Motion'}
        </p>
      </motion.div>

      <div className="space-y-6">

        {/* Display Mode */}
        <section className="card p-6" aria-labelledby="display-mode-heading">
          <h2 id="display-mode-heading" className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Display Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isActive = accessibility.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setAccessibility({ mode: m.id })}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                    isActive
                      ? 'border-brand-500/60 bg-brand-600/10'
                      : 'border-surface-border bg-surface-hover hover:border-brand-500/30'
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', isActive ? m.color : 'text-slate-500')} />
                  <div>
                    <p className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-300')}>{m.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-brand-400 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Visual toggles */}
        <section className="card p-6" aria-labelledby="visual-heading">
          <h2 id="visual-heading" className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Visual & Motion
          </h2>
          <div className="space-y-4">
            {[
              { key: 'highContrast',          label: 'High Contrast Mode',         desc: 'Maximum contrast for visual impairments' },
              { key: 'largeText',             label: 'Large Text Mode',            desc: 'Increases all text sizes by 25%' },
              { key: 'reducedMotion',         label: 'Reduce Motion',              desc: 'Disables animations and transitions' },
              { key: 'screenReaderOptimized', label: 'Screen Reader Optimized',    desc: 'Enhanced ARIA labels and focus management' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <Toggle
                  checked={(accessibility as any)[key]}
                  onChange={(v) => setAccessibility({ [key]: v })}
                  label={label}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Font size */}
        <section className="card p-6" aria-labelledby="font-heading">
          <h2 id="font-heading" className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Font Size
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Size: {accessibility.fontSize}px</span>
              <span style={{ fontSize: accessibility.fontSize }} className="text-white font-medium">Aa</span>
            </div>
            <input
              type="range" min={12} max={32} step={2}
              value={accessibility.fontSize}
              onChange={(e) => setAccessibility({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-brand-500"
              aria-label="Font size"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>12px (Small)</span>
              <span>16px (Normal)</span>
              <span>24px (Large)</span>
              <span>32px (Huge)</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[12, 16, 20, 24, 32].map((size) => (
                <button
                  key={size}
                  onClick={() => setAccessibility({ fontSize: size })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    accessibility.fontSize === size
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : 'border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30'
                  )}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Audio & Learning */}
        <section className="card p-6" aria-labelledby="audio-heading">
          <h2 id="audio-heading" className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Audio & Learning
          </h2>
          <div className="space-y-4">
            {[
              { key: 'audioLearning',   label: 'Audio Learning Mode',   desc: 'Converts all content to audio by default' },
              { key: 'voiceNavigation', label: 'Voice Navigation',      desc: 'Navigate the app using voice commands' },
              { key: 'simplifiedText',  label: 'Simplified Text',       desc: 'Automatically simplifies all content text' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <Toggle
                  checked={(accessibility as any)[key]}
                  onChange={(v) => setAccessibility({ [key]: v })}
                  label={label}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Explanation style */}
        <section className="card p-6" aria-labelledby="explain-heading">
          <h2 id="explain-heading" className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Explain-It-My-Way
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {EXPLANATION_STYLES.map((s) => {
              const isActive = accessibility.preferredExplanationStyle === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setAccessibility({ preferredExplanationStyle: s.id as any })}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                    isActive
                      ? 'border-violet-500/60 bg-violet-600/10'
                      : 'border-surface-border bg-surface-hover hover:border-violet-500/30'
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-300')}>{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-violet-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Communication style */}
        <section className="card p-6" aria-labelledby="comm-heading">
          <h2 id="comm-heading" className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Communication Style
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {COMM_STYLES.map((s) => {
              const isActive = accessibility.communicationStyle === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setAccessibility({ communicationStyle: s.id as any })}
                  className={cn(
                    'flex flex-col gap-1 p-4 rounded-xl border text-left transition-all',
                    isActive
                      ? 'border-cyan-500/60 bg-cyan-600/10'
                      : 'border-surface-border bg-surface-hover hover:border-cyan-500/30'
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-300')}>{s.label}</p>
                    {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
