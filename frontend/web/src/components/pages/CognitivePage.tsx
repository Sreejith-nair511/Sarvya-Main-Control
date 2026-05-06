'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Coffee, Zap, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cognitiveStateColor, relativeTime } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const STATE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  focused:        { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Focused' },
  optimal:        { icon: Zap,         color: 'text-brand-400',   bg: 'bg-brand-500/10 border-brand-500/20',     label: 'Optimal' },
  distracted:     { icon: AlertTriangle,color:'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     label: 'Distracted' },
  'low-engagement':{ icon: TrendingDown,color:'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20',   label: 'Low Engagement' },
  overloaded:     { icon: AlertTriangle,color:'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       label: 'Overloaded' },
};

export function CognitivePage() {
  const { userId, cognitiveLoad, setCognitiveLoad } = useSarvyaStore();
  const [trend, setTrend] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [tr, hist] = await Promise.all([
          api.cognitive.trend(userId),
          api.cognitive.history(userId),
        ]);
        setTrend(tr);
        setHistory(hist);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [userId]);

  async function runEvaluation() {
    setEvaluating(true);
    try {
      const result = await api.cognitive.evaluate({
        userId,
        responseTime: Math.round(2000 + Math.random() * 8000),
        errorRate: Math.random() * 0.6,
        sessionDuration: Math.round(5 + Math.random() * 35),
      });
      setCognitiveLoad(result);
      const [tr, hist] = await Promise.all([
        api.cognitive.trend(userId),
        api.cognitive.history(userId),
      ]);
      setTrend(tr);
      setHistory(hist);
      toast.success(`Cognitive state: ${result.state}`);
    } catch {
      // Demo fallback
      const demoStates = ['focused', 'optimal', 'distracted', 'low-engagement', 'overloaded'];
      const state = demoStates[Math.floor(Math.random() * demoStates.length)];
      const score = Math.round(20 + Math.random() * 70);
      setCognitiveLoad({ state, score, recommendation: { action: 'none', reason: 'Demo mode' }, timestamp: new Date().toISOString() });
      toast.success(`Demo evaluation: ${state}`);
    } finally { setEvaluating(false); }
  }

  const currentState = cognitiveLoad?.state || 'optimal';
  const stateConfig = STATE_CONFIG[currentState] || STATE_CONFIG.optimal;
  const StateIcon = stateConfig.icon;

  const chartData = history.slice(-20).map((h: any, i: number) => ({
    t: i,
    score: h.score,
    state: h.state,
  }));

  if (loading) return <LoadingSpinner className="h-screen" />;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Cognitive Load Balancer"
        subtitle="Real-time detection of overload, distraction, and focus — adapts your session automatically"
        icon={<Activity className="w-6 h-6 text-white" />}
        iconColor="from-amber-500 to-orange-500"
        actions={
          <button onClick={runEvaluation} disabled={evaluating} className="btn-primary">
            <Activity className={`w-4 h-4 ${evaluating ? 'animate-pulse' : ''}`} />
            {evaluating ? 'Evaluating...' : 'Run Evaluation'}
          </button>
        }
      />

      {/* Current state hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`card p-6 mb-6 border ${stateConfig.bg} flex items-center gap-6`}
      >
        <div className={`p-4 rounded-2xl ${stateConfig.bg} border ${stateConfig.bg}`}>
          <StateIcon className={`w-8 h-8 ${stateConfig.color}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Cognitive State</p>
          <p className={`text-2xl font-bold ${stateConfig.color}`}>{stateConfig.label}</p>
          {cognitiveLoad?.recommendation?.reason && (
            <p className="text-sm text-slate-400 mt-1">{cognitiveLoad.recommendation.reason}</p>
          )}
        </div>
        <ScoreRing score={cognitiveLoad?.score ?? 40} size={90} label="Load Score" />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Trend"
          value={trend?.trend ?? 'stable'}
          icon={trend?.trend === 'improving' ? <TrendingDown className="w-4 h-4" /> : trend?.trend === 'worsening' ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          color={trend?.trend === 'improving' ? 'text-emerald-400' : trend?.trend === 'worsening' ? 'text-rose-400' : 'text-slate-400'}
        />
        <StatCard label="Avg Load Score" value={`${trend?.averageScore ?? 40}%`} color="text-amber-400" />
        <StatCard label="Events Recorded" value={history.length} color="text-brand-400" />
        <StatCard
          label="Recommendation"
          value={cognitiveLoad?.recommendation?.action?.replace(/-/g, ' ') ?? 'none'}
          color="text-cyan-400"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Load Score Over Time</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="loadGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Load Score']} />
              <Area type="monotone" dataKey="score" stroke="#f59e0b" fill="url(#loadGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Adaptation recommendation */}
      {cognitiveLoad?.recommendation && cognitiveLoad.recommendation.action !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 border border-amber-500/20 bg-amber-500/5"
        >
          <div className="flex items-start gap-4">
            <Coffee className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                Recommended: {cognitiveLoad.recommendation.action.replace(/-/g, ' ')}
              </p>
              <p className="text-sm text-slate-400">{cognitiveLoad.recommendation.reason}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {cognitiveLoad.recommendation.newDifficulty && (
                  <Badge variant="amber">→ {cognitiveLoad.recommendation.newDifficulty}</Badge>
                )}
                {cognitiveLoad.recommendation.newFormat && (
                  <Badge variant="cyan">→ {cognitiveLoad.recommendation.newFormat}</Badge>
                )}
                {cognitiveLoad.recommendation.breakDurationMinutes && (
                  <Badge variant="emerald">Break: {cognitiveLoad.recommendation.breakDurationMinutes} min</Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
