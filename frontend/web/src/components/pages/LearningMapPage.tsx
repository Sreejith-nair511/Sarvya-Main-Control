'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, CheckCircle, Circle, Lock, Star, TrendingUp, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Learning path definition ─────────────────────────────────
const LEARNING_PATH = [
  {
    id: 'basics', title: 'Foundations', subject: 'Core Skills',
    topics: ['Numbers', 'Shapes', 'Colors', 'Patterns'],
    requiredScore: 0, color: 'emerald',
  },
  {
    id: 'math1', title: 'Basic Math', subject: 'Mathematics',
    topics: ['Addition', 'Subtraction', 'Multiplication', 'Division'],
    requiredScore: 40, color: 'cyan',
  },
  {
    id: 'science1', title: 'Life Science', subject: 'Science',
    topics: ['Plants', 'Animals', 'Ecosystems', 'Photosynthesis'],
    requiredScore: 50, color: 'violet',
  },
  {
    id: 'math2', title: 'Algebra', subject: 'Mathematics',
    topics: ['Variables', 'Equations', 'Fractions', 'Geometry'],
    requiredScore: 60, color: 'amber',
  },
  {
    id: 'science2', title: 'Physical Science', subject: 'Science',
    topics: ['Forces', 'Energy', 'Waves', 'Electricity'],
    requiredScore: 65, color: 'pink',
  },
  {
    id: 'advanced', title: 'Advanced Topics', subject: 'Mixed',
    topics: ['Calculus', 'Chemistry', 'Physics', 'Biology'],
    requiredScore: 75, color: 'brand',
  },
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  cyan:    'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
  violet:  'border-violet-500/50 bg-violet-500/10 text-violet-400',
  amber:   'border-amber-500/50 bg-amber-500/10 text-amber-400',
  pink:    'border-pink-500/50 bg-pink-500/10 text-pink-400',
  brand:   'border-brand-500/50 bg-brand-500/10 text-brand-400',
};

export function LearningMapPage() {
  const { userId, twin } = useSarvyaStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions.forUser(userId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a: number, s: any) => a + (s.performance_score || 0), 0) / sessions.length)
    : twin?.understandingScore ?? 50;

  const chartData = sessions.slice(-10).map((s: any, i: number) => ({
    session: `S${i + 1}`,
    score: s.performance_score || 0,
    subject: s.subject,
  }));

  // Determine unlocked nodes
  function isUnlocked(node: typeof LEARNING_PATH[0]) {
    return avgScore >= node.requiredScore;
  }
  function isCompleted(node: typeof LEARNING_PATH[0]) {
    return sessions.some((s: any) =>
      s.subject?.toLowerCase().includes(node.subject.toLowerCase()) && s.performance_score >= 70
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Learning Map"
        subtitle="Your personalised learning journey — track progress across all subjects"
        icon={<Map className="w-6 h-6 text-white" />}
        iconColor="from-teal-500 to-cyan-500"
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Sessions Completed', value: sessions.length, color: 'text-brand-400' },
          { label: 'Average Score',      value: `${avgScore}%`,  color: 'text-emerald-400' },
          { label: 'Nodes Unlocked',     value: LEARNING_PATH.filter(isUnlocked).length, color: 'text-cyan-400' },
          { label: 'Nodes Completed',    value: LEARNING_PATH.filter(isCompleted).length, color: 'text-violet-400' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning path map */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Learning Path</h2>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-surface-border" />

            <div className="space-y-4">
              {LEARNING_PATH.map((node, i) => {
                const unlocked  = isUnlocked(node);
                const completed = isCompleted(node);
                const colorCls  = COLOR_MAP[node.color];

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={cn(
                      'relative flex items-start gap-4 p-4 rounded-2xl border transition-all',
                      completed ? colorCls :
                      unlocked  ? 'border-surface-border bg-surface-hover' :
                                  'border-surface-border bg-surface opacity-50'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10',
                      completed ? 'bg-emerald-500/20' : unlocked ? 'bg-surface-border' : 'bg-surface'
                    )}>
                      {completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                       unlocked  ? <Circle className="w-5 h-5 text-slate-400" /> :
                                   <Lock className="w-5 h-5 text-slate-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{node.title}</p>
                        <Badge variant={completed ? 'emerald' : unlocked ? 'slate' : 'slate'}>
                          {completed ? 'Completed' : unlocked ? 'Unlocked' : `Requires ${node.requiredScore}%`}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{node.subject}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {node.topics.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-lg bg-surface text-xs text-slate-400 border border-surface-border">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {completed && <Star className="w-4 h-4 text-amber-400 shrink-0" />}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Overall progress ring */}
          <div className="card p-6 flex flex-col items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider self-start">Overall Progress</h2>
            <ScoreRing
              score={Math.round((LEARNING_PATH.filter(isCompleted).length / LEARNING_PATH.length) * 100)}
              size={120}
              label="Path Complete"
              color="#10b981"
            />
          </div>

          {/* Score trend */}
          {chartData.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Trend</h2>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#2a2a45" strokeDasharray="3 3" />
                  <XAxis dataKey="session" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak areas */}
          {twin?.predictedWeakAreas?.length > 0 && (
            <div className="card p-4 border border-rose-500/20 bg-rose-500/5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {twin.predictedWeakAreas.map((a: string) => (
                  <Badge key={a} variant="rose">{a}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
