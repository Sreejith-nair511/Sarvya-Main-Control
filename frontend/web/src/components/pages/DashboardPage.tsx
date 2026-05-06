'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Activity, Cpu, MessageCircle,
  TrendingUp, AlertTriangle, CheckCircle, Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { StatCard } from '@/components/ui/StatCard';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { difficultyBadge, cognitiveStateColor, relativeTime } from '@/lib/utils';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const ITEM = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export function DashboardPage() {
  const { userId, setTwin, setPrediction, setCognitiveLoad, twin, prediction, cognitiveLoad } = useSarvyaStore();
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [t, p, tr] = await Promise.all([
          api.twin.get(userId),
          api.twin.predict(userId),
          api.cognitive.trend(userId),
        ]);
        setTwin(t);
        setPrediction(p);
        setTrend(tr);
      } catch { /* backend may not be running in dev */ }
      finally { setLoading(false); }
    }
    load();
  }, [userId]);

  // Demo data for charts when backend is offline
  const radarData = [
    { subject: 'Understanding', A: twin?.understandingScore ?? 65 },
    { subject: 'Engagement',    A: twin?.engagementScore ?? 72 },
    { subject: 'Focus',         A: 100 - (twin?.cognitiveLoadScore ?? 45) },
    { subject: 'Completion',    A: 78 },
    { subject: 'Retention',     A: 60 },
  ];

  const areaData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    score: Math.round(50 + Math.random() * 40),
    load: Math.round(20 + Math.random() * 50),
  }));

  if (loading) return <LoadingSpinner className="h-screen" />;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="SARVYA Control Center"
        subtitle="Your inclusive AI learning ecosystem — real-time adaptive intelligence"
        icon={<Zap className="w-6 h-6 text-white" />}
        iconColor="from-brand-500 to-violet-500"
        actions={
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400">Live</span>
          </div>
        }
      />

      {/* Stat cards */}
      <motion.div
        variants={STAGGER} initial="hidden" animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <motion.div variants={ITEM}>
          <StatCard
            label="Understanding"
            value={`${twin?.understandingScore ?? 65}%`}
            sub="Current comprehension level"
            icon={<Brain className="w-4 h-4" />}
            color="text-violet-400"
            trend="up" trendValue="+5% this week"
          />
        </motion.div>
        <motion.div variants={ITEM}>
          <StatCard
            label="Engagement"
            value={`${twin?.engagementScore ?? 72}%`}
            sub="Active participation score"
            icon={<TrendingUp className="w-4 h-4" />}
            color="text-cyan-400"
            trend="up" trendValue="+3% today"
          />
        </motion.div>
        <motion.div variants={ITEM}>
          <StatCard
            label="Cognitive Load"
            value={`${twin?.cognitiveLoadScore ?? 45}%`}
            sub="Mental effort level"
            icon={<Activity className="w-4 h-4" />}
            color={twin?.cognitiveLoadScore > 70 ? 'text-rose-400' : 'text-amber-400'}
            trend="neutral" trendValue="Optimal range"
          />
        </motion.div>
        <motion.div variants={ITEM}>
          <StatCard
            label="Difficulty"
            value={twin?.currentDifficulty ?? 'medium'}
            sub="AI-adapted level"
            icon={<Zap className="w-4 h-4" />}
            color="text-brand-400"
          />
        </motion.div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Learning Profile</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2a2a45" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Score rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="card p-6 flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Core Scores</h2>
          <div className="flex items-center justify-around flex-1">
            <ScoreRing score={twin?.understandingScore ?? 65} label="Understanding" size={90} />
            <ScoreRing score={twin?.engagementScore ?? 72}    label="Engagement"    size={90} color="#06b6d4" />
            <ScoreRing score={100 - (twin?.cognitiveLoadScore ?? 45)} label="Focus" size={90} color="#8b5cf6" />
          </div>
        </motion.div>

        {/* Prediction panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-6 flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">AI Prediction</h2>
          {prediction ? (
            <>
              <div className="flex items-center gap-3">
                {prediction.riskLevel === 'high' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                ) : prediction.riskLevel === 'medium' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white capitalize">
                    {prediction.riskLevel} Risk
                  </p>
                  <p className="text-xs text-slate-500">
                    Confidence: {prediction.confidenceScore}%
                  </p>
                </div>
              </div>
              {prediction.predictedWeakAreas?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Weak areas detected:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {prediction.predictedWeakAreas.map((a: string) => (
                      <Badge key={a} variant="rose">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {prediction.recommendedInterventions?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500">Recommended actions:</p>
                  {prediction.recommendedInterventions.slice(0, 3).map((i: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-brand-400 mt-0.5">→</span>
                      <span>{i}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-500">No prediction data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Area chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card p-6 mb-6"
      >
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Weekly Performance</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} name="Score" />
            <Area type="monotone" dataKey="load"  stroke="#f59e0b" fill="url(#loadGrad)"  strokeWidth={2} name="Cog. Load" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Twin adaptations */}
      {twin?.adaptationHistory?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent AI Adaptations</h2>
          <div className="space-y-3">
            {twin.adaptationHistory.slice(-5).reverse().map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover">
                <Brain className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{a.reason}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{relativeTime(a.timestamp)}</p>
                </div>
                <Badge variant="brand">{a.trigger}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
