'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Star, Trophy, RefreshCw, ChevronRight, CheckCircle, XCircle, Zap, Brain } from 'lucide-react';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Question bank (difficulty-aware) ────────────────────────
const QUESTIONS: Record<string, any[]> = {
  'very-easy': [
    { q: 'What is 2 + 2?',           options: ['3','4','5','6'],         answer: '4' },
    { q: 'What color is the sky?',   options: ['Red','Blue','Green','Yellow'], answer: 'Blue' },
    { q: 'How many sides does a triangle have?', options: ['2','3','4','5'], answer: '3' },
  ],
  easy: [
    { q: 'What is 12 × 3?',          options: ['34','36','38','40'],     answer: '36' },
    { q: 'What is the capital of France?', options: ['Berlin','Madrid','Paris','Rome'], answer: 'Paris' },
    { q: 'What is 50% of 80?',       options: ['30','35','40','45'],     answer: '40' },
  ],
  medium: [
    { q: 'What is √144?',            options: ['10','11','12','13'],     answer: '12' },
    { q: 'What is photosynthesis?',  options: ['Breathing','Making food from sunlight','Digestion','Movement'], answer: 'Making food from sunlight' },
    { q: 'Solve: 3x + 6 = 21',       options: ['x=3','x=4','x=5','x=6'], answer: 'x=5' },
  ],
  hard: [
    { q: 'What is the derivative of x²?', options: ['x','2x','x²','2x²'], answer: '2x' },
    { q: 'What is the speed of light (approx)?', options: ['3×10⁶ m/s','3×10⁸ m/s','3×10¹⁰ m/s','3×10⁴ m/s'], answer: '3×10⁸ m/s' },
    { q: 'What is the powerhouse of the cell?', options: ['Nucleus','Ribosome','Mitochondria','Golgi'], answer: 'Mitochondria' },
  ],
  'very-hard': [
    { q: 'What is ∫x² dx?',          options: ['x³','x³/3 + C','2x','3x²'], answer: 'x³/3 + C' },
    { q: 'What is Avogadro\'s number?', options: ['6.02×10²³','3.14×10²³','1.38×10²³','9.81×10²³'], answer: '6.02×10²³' },
    { q: 'What does DNA stand for?', options: ['Deoxyribonucleic Acid','Diribonucleic Acid','Deoxyribose Nucleic Acid','None'], answer: 'Deoxyribonucleic Acid' },
  ],
};

type GameState = 'idle' | 'playing' | 'answered' | 'complete';

export function GamePage() {
  const { userId, twin, setTwin } = useSarvyaStore();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [difficulty, setDifficulty] = useState<string>(twin?.currentDifficulty || 'medium');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [xp, setXp] = useState(0);

  const currentQ = questions[currentIdx];
  const isCorrect = selected === currentQ?.answer;
  const progress = questions.length > 0 ? ((currentIdx + (gameState === 'answered' ? 1 : 0)) / questions.length) * 100 : 0;

  function startGame() {
    const pool = QUESTIONS[difficulty] || QUESTIONS.medium;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setXp(0);
    setSelected(null);
    setResponseTimes([]);
    setGameState('playing');
    setStartTime(Date.now());
  }

  function selectAnswer(option: string) {
    if (gameState !== 'playing') return;
    const rt = Date.now() - startTime;
    setResponseTimes(prev => [...prev, rt]);
    setSelected(option);
    setGameState('answered');

    if (option === currentQ.answer) {
      const bonus = rt < 3000 ? 20 : rt < 6000 ? 10 : 5;
      setScore(prev => prev + bonus);
      setStreak(prev => prev + 1);
      setXp(prev => prev + bonus + streak * 2);
    } else {
      setStreak(0);
    }
  }

  async function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setGameState('complete');
      await submitResults();
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelected(null);
      setGameState('playing');
      setStartTime(Date.now());
    }
  }

  async function submitResults() {
    const totalPossible = questions.length * 20;
    const pct = Math.round((score / totalPossible) * 100);
    const avgRt = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    try {
      await api.sessions.create({ userId, subject: 'Game', platform: 'game' });
      const updated = await api.twin.update(userId, {
        sessionScore: pct,
        topicsAttempted: ['game-quiz'],
        cognitiveLoadScore: Math.min(100, Math.round(avgRt / 100)),
      });
      setTwin(updated);
      toast.success(`Twin updated! Score: ${pct}%`);
    } catch {
      toast.success(`Game complete! Score: ${pct}%`);
    }
  }

  const DIFF_OPTIONS = ['very-easy', 'easy', 'medium', 'hard', 'very-hard'];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Learning Game"
        subtitle="Adaptive quiz — difficulty adjusts based on your AI twin's recommendations"
        icon={<Gamepad2 className="w-6 h-6 text-white" />}
        iconColor="from-orange-500 to-amber-500"
      />

      <AnimatePresence mode="wait">

        {/* Idle / Setup */}
        {gameState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="card p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow-glow-brand">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ready to Learn?</h2>
                <p className="text-sm text-slate-400 mt-1">
                  AI-recommended difficulty: <span className="text-brand-300 font-semibold">{twin?.currentDifficulty || 'medium'}</span>
                </p>
              </div>

              {/* Difficulty selector */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Choose Difficulty</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {DIFF_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize',
                        difficulty === d
                          ? 'bg-brand-600/20 border-brand-500/60 text-brand-300'
                          : 'border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30'
                      )}
                    >
                      {d.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                {difficulty === twin?.currentDifficulty && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI recommended</span>
                  </div>
                )}
              </div>

              <button onClick={startGame} className="btn-primary mx-auto px-8 py-3 text-base">
                <Zap className="w-5 h-5" /> Start Game
              </button>
            </div>
          </motion.div>
        )}

        {/* Playing / Answered */}
        {(gameState === 'playing' || gameState === 'answered') && currentQ && (
          <motion.div
            key={`q-${currentIdx}`}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="brand">{currentIdx + 1}/{questions.length}</Badge>
                {streak > 1 && (
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                    <Zap className="w-4 h-4" /> {streak}x streak
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-slate-300">
                  <Star className="w-4 h-4 text-amber-400" /> {xp} XP
                </div>
                <Badge variant="emerald">{score} pts</Badge>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Question */}
            <div className="card p-6 space-y-5">
              <p className="text-lg font-semibold text-white leading-relaxed">{currentQ.q}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((opt: string) => {
                  let style = 'border-surface-border bg-surface-hover text-slate-200 hover:border-brand-500/50 hover:bg-surface-border';
                  if (gameState === 'answered') {
                    if (opt === currentQ.answer) style = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
                    else if (opt === selected) style = 'border-rose-500/60 bg-rose-500/10 text-rose-300';
                    else style = 'border-surface-border bg-surface-hover text-slate-500 opacity-50';
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(opt)}
                      disabled={gameState === 'answered'}
                      className={cn('p-4 rounded-xl border text-sm font-medium text-left transition-all', style)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt}</span>
                        {gameState === 'answered' && opt === currentQ.answer && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        {gameState === 'answered' && opt === selected && opt !== currentQ.answer && <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {gameState === 'answered' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border',
                    isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCorrect
                      ? <><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="text-emerald-300 font-semibold">Correct! +{streak > 1 ? `${streak * 2} bonus` : '20'} pts</span></>
                      : <><XCircle className="w-5 h-5 text-rose-400" /><span className="text-rose-300 font-semibold">Incorrect — answer: {currentQ.answer}</span></>
                    }
                  </div>
                  <button onClick={nextQuestion} className="btn-primary px-4 py-2 text-sm">
                    {currentIdx + 1 >= questions.length ? 'Finish' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Complete */}
        {gameState === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Game Complete!</h2>
              <p className="text-slate-400 mt-1">Your AI twin has been updated with your results</p>
            </div>

            <div className="flex items-center justify-center gap-8">
              <ScoreRing score={Math.round((score / (questions.length * 20)) * 100)} size={100} label="Score" />
              <div className="space-y-3 text-left">
                <div>
                  <p className="text-xs text-slate-500">Total Points</p>
                  <p className="text-2xl font-bold text-amber-400">{score}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">XP Earned</p>
                  <p className="text-xl font-bold text-brand-400">{xp} XP</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Best Streak</p>
                  <p className="text-xl font-bold text-emerald-400">{streak}x</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={startGame} className="btn-primary">
                <RefreshCw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={() => setGameState('idle')} className="btn-secondary">
                Change Difficulty
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
