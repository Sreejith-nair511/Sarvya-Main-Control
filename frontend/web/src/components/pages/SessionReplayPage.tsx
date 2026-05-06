'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ChevronUp, Clock, Target, Brain, Cpu, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { relativeTime } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function SessionReplayPage() {
  const { userId } = useSarvyaStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.sessions.forUser(userId)
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const chartData = sessions.slice(-8).map((s: any, i: number) => ({
    name: `S${i + 1}`,
    score: s.performance_score || 0,
    subject: s.subject || 'General',
  }));

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a: number, s: any) => a + (s.performance_score || 0), 0) / sessions.length)
    : 0;

  const bestSession = sessions.reduce((best: any, s: any) =>
    (s.performance_score || 0) > (best?.performance_score || 0) ? s : best, null);

  if (loading) return <LoadingSpinner className="h-screen" />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Session Replay"
        subtitle="Review your complete learning history — every session, score, and adaptation"
        icon={<History className="w-6 h-6 text-white" />}
        iconColor="from-blue-500 to-brand-500"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: sessions.length,    color: 'text-brand-400' },
          { label: 'Average Score',  value: `${avgScore}%`,     color: 'text-emerald-400' },
          { label: 'Best Score',     value: `${bestSession?.performance_score ?? 0}%`, color: 'text-amber-400' },
          { label: 'Subjects',       value: [...new Set(sessions.map((s: any) => s.subject))].length, color: 'text-violet-400' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Score History</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 12 }}
                formatter={(v: any, _: any, p: any) => [`${v}%`, p.payload.subject]}
              />
              {chartData.map((entry, i) => (
                <Bar key={i} dataKey="score" radius={[6, 6, 0, 0]}>
                  <Cell fill={entry.score >= 75 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#f43f5e'} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">All Sessions</h2>

        {sessions.length === 0 ? (
          <div className="card p-12 text-center">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No sessions yet. Complete a game or learning activity to see your history.</p>
          </div>
        ) : (
          [...sessions].reverse().map((session: any) => {
            const isOpen = expanded === session.id;
            const score  = session.performance_score || 0;
            const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';

            return (
              <motion.div key={session.id} layout className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : session.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-hover transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${scoreColor} bg-surface-border shrink-0`}>
                    {score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{session.subject || 'General'}</p>
                      <Badge variant={session.platform === 'game' ? 'amber' : 'brand'}>{session.platform || 'web'}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relativeTime(session.start_time || session.startTime)}
                      </span>
                      {session.topics_attempted?.length > 0 && (
                        <span className="text-xs text-slate-500">
                          {session.topics_attempted.length} topics
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={score} size={40} strokeWidth={4} />
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-surface-border space-y-3">
                        {/* Topics */}
                        {session.topics_attempted?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">Topics Attempted</p>
                            <div className="flex flex-wrap gap-1.5">
                              {session.topics_attempted.map((t: string) => (
                                <Badge key={t} variant="slate">{t}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Adaptations */}
                        {session.adaptations_applied?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                              <Brain className="w-3 h-3" /> AI Adaptations Applied
                            </p>
                            <div className="space-y-1">
                              {session.adaptations_applied.map((a: any, i: number) => (
                                <p key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                  <span className="text-brand-400 shrink-0">→</span>
                                  {a.reason || JSON.stringify(a)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Accessibility features used */}
                        {session.accessibility_features?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">Accessibility Features Used</p>
                            <div className="flex flex-wrap gap-1.5">
                              {session.accessibility_features.map((f: string) => (
                                <Badge key={f} variant="cyan">{f}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span>Completion: {Math.round((session.completion_rate || 0) * 100)}%</span>
                          {session.end_time && <span>Duration: {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} min</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
