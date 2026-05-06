'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { difficultyBadge, relativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export function TwinPage() {
  const { userId, twin, setTwin, prediction, setPrediction } = useSarvyaStore();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [t, p] = await Promise.all([api.twin.get(userId), api.twin.predict(userId)]);
        setTwin(t); setPrediction(p);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [userId]);

  async function simulateSession() {
    setUpdating(true);
    try {
      const score = Math.round(40 + Math.random() * 55);
      const topics = ['algebra', 'fractions', 'geometry', 'probability'].slice(0, Math.ceil(Math.random() * 3));
      const t = await api.twin.update(userId, {
        sessionScore: score,
        topicsAttempted: topics,
        cognitiveLoadScore: Math.round(20 + Math.random() * 60),
      });
      setTwin(t);
      const p = await api.twin.predict(userId);
      setPrediction(p);
      toast.success(`Session simulated — score: ${score}%`);
    } catch {
      toast.error('Backend offline — showing demo data');
    } finally { setUpdating(false); }
  }

  if (loading) return <LoadingSpinner className="h-screen" />;

  const t = twin || {
    currentDifficulty: 'medium', understandingScore: 65, engagementScore: 72,
    cognitiveLoadScore: 45, recommendedFormat: 'visual', recommendedStyle: 'step-by-step',
    predictedWeakAreas: ['fractions', 'algebra'], adaptationHistory: [], lastUpdated: new Date().toISOString(),
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="AI Learning Twin"
        subtitle="Your digital twin predicts difficulties, detects weak understanding, and adapts in real time"
        icon={<Brain className="w-6 h-6 text-white" />}
        iconColor="from-violet-500 to-brand-500"
        actions={
          <button onClick={simulateSession} disabled={updating} className="btn-primary">
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            Simulate Session
          </button>
        }
      />

      {/* Score rings */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { score: t.understandingScore, label: 'Understanding', color: '#8b5cf6' },
          { score: t.engagementScore,    label: 'Engagement',    color: '#06b6d4' },
          { score: 100 - t.cognitiveLoadScore, label: 'Focus',  color: '#10b981' },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -2 }}
            className="card p-6 flex flex-col items-center gap-3"
          >
            <ScoreRing score={item.score} size={100} color={item.color} />
            <p className="text-sm font-semibold text-white">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current state */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Current Twin State</h2>
          <div className="space-y-3">
            {[
              { label: 'Difficulty Level',    value: t.currentDifficulty,   badge: difficultyBadge(t.currentDifficulty) },
              { label: 'Recommended Format',  value: t.recommendedFormat,   badge: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
              { label: 'Explanation Style',   value: t.recommendedStyle,    badge: 'bg-violet-500/20 text-violet-400 border border-violet-500/30' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <span className="text-sm text-slate-400">{row.label}</span>
                <span className={`badge capitalize ${row.badge}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Last Updated</span>
              <span className="text-xs text-slate-500">{relativeTime(t.lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Weak areas + prediction */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Predicted Weak Areas</h2>
          {t.predictedWeakAreas?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {t.predictedWeakAreas.map((area: string) => (
                <div key={area} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-sm text-rose-300 capitalize">{area}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">No weak areas detected</span>
            </div>
          )}

          {prediction && (
            <div className="mt-4 pt-4 border-t border-surface-border space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">AI Interventions</span>
              </div>
              {prediction.recommendedInterventions?.map((i: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-brand-400 mt-0.5 shrink-0">→</span>
                  <span>{i}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adaptation history */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Adaptation History</h2>
        {t.adaptationHistory?.length > 0 ? (
          <div className="space-y-3">
            {[...t.adaptationHistory].reverse().slice(0, 8).map((a: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover"
              >
                <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{a.reason}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{relativeTime(a.timestamp)}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">{a.previousDifficulty} → {a.newDifficulty}</span>
                  </div>
                </div>
                <Badge variant="brand">{a.trigger}</Badge>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            No adaptations yet. Simulate a session to see the twin in action.
          </p>
        )}
      </div>
    </div>
  );
}
