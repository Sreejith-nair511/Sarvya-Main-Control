'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Code2, FlaskConical, Stethoscope, Scale, Palette,
  ChevronRight, Star, Lock, CheckCircle, Zap, TrendingUp, BookOpen,
  ExternalLink, Globe, Maximize2, Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const CAREER_PATHS = [
  {
    id: 'tech',
    title: 'Technology & Engineering',
    icon: Code2,
    color: 'from-brand-500 to-violet-500',
    border: 'border-brand-500/30',
    bg: 'bg-brand-500/10',
    text: 'text-brand-400',
    roles: ['Software Engineer', 'Data Scientist', 'AI/ML Engineer', 'Cybersecurity Analyst'],
    skills: ['Mathematics', 'Logic', 'Programming', 'Problem Solving'],
    modules: [
      { title: 'Intro to Algorithms', duration: '2h', difficulty: 'easy',   completed: false },
      { title: 'Data Structures',     duration: '3h', difficulty: 'medium', completed: false },
      { title: 'Web Development',     duration: '4h', difficulty: 'medium', completed: false },
      { title: 'Machine Learning',    duration: '5h', difficulty: 'hard',   completed: false },
    ],
  },
  {
    id: 'science',
    title: 'Science & Research',
    icon: FlaskConical,
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    roles: ['Research Scientist', 'Biologist', 'Chemist', 'Environmental Scientist'],
    skills: ['Biology', 'Chemistry', 'Physics', 'Critical Thinking'],
    modules: [
      { title: 'Scientific Method',   duration: '1h', difficulty: 'easy',   completed: false },
      { title: 'Cell Biology',        duration: '2h', difficulty: 'medium', completed: false },
      { title: 'Chemical Reactions',  duration: '3h', difficulty: 'medium', completed: false },
      { title: 'Research Methods',    duration: '4h', difficulty: 'hard',   completed: false },
    ],
  },
  {
    id: 'health',
    title: 'Healthcare & Medicine',
    icon: Stethoscope,
    color: 'from-rose-500 to-pink-500',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    roles: ['Doctor', 'Nurse', 'Pharmacist', 'Medical Researcher'],
    skills: ['Biology', 'Chemistry', 'Empathy', 'Anatomy'],
    modules: [
      { title: 'Human Anatomy',       duration: '3h', difficulty: 'medium', completed: false },
      { title: 'Physiology Basics',   duration: '3h', difficulty: 'medium', completed: false },
      { title: 'Medical Ethics',      duration: '2h', difficulty: 'easy',   completed: false },
      { title: 'Clinical Skills',     duration: '5h', difficulty: 'hard',   completed: false },
    ],
  },
  {
    id: 'law',
    title: 'Law & Social Sciences',
    icon: Scale,
    color: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    roles: ['Lawyer', 'Judge', 'Social Worker', 'Policy Analyst'],
    skills: ['Reading', 'Writing', 'Logic', 'Communication'],
    modules: [
      { title: 'Constitutional Law',  duration: '3h', difficulty: 'medium', completed: false },
      { title: 'Legal Writing',       duration: '2h', difficulty: 'easy',   completed: false },
      { title: 'Criminal Justice',    duration: '3h', difficulty: 'medium', completed: false },
      { title: 'International Law',   duration: '4h', difficulty: 'hard',   completed: false },
    ],
  },
  {
    id: 'arts',
    title: 'Arts & Creative',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    roles: ['Designer', 'Animator', 'Musician', 'Writer'],
    skills: ['Creativity', 'Design', 'Communication', 'Storytelling'],
    modules: [
      { title: 'Design Principles',   duration: '2h', difficulty: 'easy',   completed: false },
      { title: 'Color Theory',        duration: '1h', difficulty: 'easy',   completed: false },
      { title: 'Digital Art',         duration: '3h', difficulty: 'medium', completed: false },
      { title: 'Portfolio Building',  duration: '4h', difficulty: 'medium', completed: false },
    ],
  },
];

const DIFF_BADGE: Record<string, any> = {
  easy: 'emerald', medium: 'amber', hard: 'rose',
};

export function CareerOSPage() {
  const { userId, twin } = useSarvyaStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [starting, setStarting] = useState<string | null>(null);

  const selectedPath = CAREER_PATHS.find(p => p.id === selected);

  async function startModule(pathId: string, moduleTitle: string) {
    const key = `${pathId}-${moduleTitle}`;
    setStarting(key);
    try {
      await api.sessions.create({ userId, subject: moduleTitle, platform: 'web' });
      setCompletedModules(prev => new Set([...prev, key]));
      toast.success(`Started: ${moduleTitle}`);
    } catch {
      setCompletedModules(prev => new Set([...prev, key]));
      toast.success(`Module started: ${moduleTitle}`);
    } finally { setStarting(null); }
  }

  const overallProgress = Math.round((completedModules.size / (CAREER_PATHS.length * 4)) * 100);
  const [careerTab, setCareerTab] = useState<'portal' | 'modules'>('portal');
  const [portalLoaded, setPortalLoaded] = useState(false);
  const [portalFullscreen, setPortalFullscreen] = useState(false);
  const CAREER_URL = 'https://sarvya-carrer.vercel.app/';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Career OS"
        subtitle="Explore career paths, build skills, and track your professional development"
        icon={<Briefcase className="w-6 h-6 text-white" />}
        iconColor="from-purple-500 to-brand-500"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setCareerTab('portal')}
              className={cn('btn-secondary text-sm', careerTab === 'portal' && 'border-brand-500/50 text-brand-300 bg-brand-600/10')}
            >
              <Globe className="w-4 h-4" /> Career Portal
            </button>
            <button
              onClick={() => setCareerTab('modules')}
              className={cn('btn-secondary text-sm', careerTab === 'modules' && 'border-brand-500/50 text-brand-300 bg-brand-600/10')}
            >
              <Briefcase className="w-4 h-4" /> Modules
            </button>
          </div>
        }
      />

      {/* ── CAREER PORTAL EMBED ─────────────────────────── */}
      {careerTab === 'portal' && (
        <div className="space-y-4">
          {/* Browser chrome */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface text-xs text-slate-400 border border-surface-border font-mono">
                <Globe className="w-3 h-3" />
                {CAREER_URL}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={CAREER_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2" title="Open in new tab">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={() => setPortalFullscreen(!portalFullscreen)} className="btn-ghost p-2">
                {portalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* iFrame */}
          <div className={cn(
            'relative rounded-2xl overflow-hidden border border-surface-border bg-surface',
            portalFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[650px]'
          )}>
            {!portalLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface z-10">
                <div className="w-10 h-10 border-2 border-surface-border border-t-brand-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading SARVYA Career Portal...</p>
              </div>
            )}
            <iframe
              src={CAREER_URL}
              className="w-full h-full border-0"
              title="SARVYA Career Portal"
              onLoad={() => setPortalLoaded(true)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
            {portalFullscreen && (
              <button onClick={() => setPortalFullscreen(false)} className="absolute top-4 right-4 p-2 rounded-xl bg-surface-card border border-surface-border text-white z-20">
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {portalFullscreen && <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setPortalFullscreen(false)} />}
        </div>
      )}

      {/* ── MODULES ─────────────────────────────────────── */}
      {careerTab === 'modules' && (<>

      {/* Progress overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4 lg:col-span-1">
          <ScoreRing score={overallProgress} size={70} label="Progress" color="#8b5cf6" />
          <div>
            <p className="text-xs text-slate-500">Career Progress</p>
            <p className="text-lg font-bold text-white">{completedModules.size} modules</p>
          </div>
        </div>
        {[
          { label: 'Paths Available', value: CAREER_PATHS.length, color: 'text-brand-400' },
          { label: 'AI Recommended', value: twin?.understandingScore >= 70 ? 'Technology' : 'Science', color: 'text-cyan-400' },
          { label: 'XP Earned', value: `${completedModules.size * 150} XP`, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career path cards */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Career Paths</h2>
          {CAREER_PATHS.map((path) => {
            const Icon = path.icon;
            const isSelected = selected === path.id;
            const completed = CAREER_PATHS.find(p => p.id === path.id)?.modules
              .filter(m => completedModules.has(`${path.id}-${m.title}`)).length || 0;

            return (
              <motion.button
                key={path.id}
                whileHover={{ x: 2 }}
                onClick={() => setSelected(isSelected ? null : path.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all',
                  isSelected
                    ? `${path.border} ${path.bg}`
                    : 'border-surface-border bg-surface-hover hover:border-surface-border'
                )}
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${path.color} shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{path.title}</p>
                  <p className="text-xs text-slate-500">{completed}/4 modules</p>
                </div>
                <ChevronRight className={cn('w-4 h-4 transition-transform', isSelected ? `rotate-90 ${path.text}` : 'text-slate-600')} />
              </motion.button>
            );
          })}
        </div>

        {/* Path detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selectedPath ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card p-12 text-center h-full flex flex-col items-center justify-center gap-4"
              >
                <Briefcase className="w-12 h-12 text-slate-600" />
                <p className="text-slate-400">Select a career path to explore modules and roles</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedPath.id}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                {/* Header */}
                <div className={`card p-5 border ${selectedPath.border} ${selectedPath.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${selectedPath.color}`}>
                      <selectedPath.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedPath.title}</h3>
                      <p className="text-xs text-slate-400">{selectedPath.roles.length} career roles</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedPath.roles.map(r => <Badge key={r} variant="slate">{r}</Badge>)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Key Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPath.skills.map(s => (
                        <span key={s} className={`px-2 py-0.5 rounded-lg text-xs font-medium ${selectedPath.bg} ${selectedPath.text} border ${selectedPath.border}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modules */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Learning Modules</h3>
                  {selectedPath.modules.map((mod, i) => {
                    const key = `${selectedPath.id}-${mod.title}`;
                    const done = completedModules.has(key);
                    const isStarting = starting === key;

                    return (
                      <motion.div
                        key={mod.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border transition-all',
                          done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-surface-border bg-surface-hover'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', done ? 'bg-emerald-500/20' : 'bg-surface-border')}>
                          {done ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <BookOpen className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{mod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{mod.duration}</span>
                            <Badge variant={DIFF_BADGE[mod.difficulty]}>{mod.difficulty}</Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => startModule(selectedPath.id, mod.title)}
                          disabled={isStarting}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            done
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-brand-600/20 text-brand-300 border border-brand-600/30 hover:bg-brand-600/30'
                          )}
                        >
                          {done ? '✓ Done' : isStarting ? '...' : 'Start'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </>)}
    </div>
  );
}
