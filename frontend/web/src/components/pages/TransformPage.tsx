
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Volume2, FileText, GitBranch, BookOpen, List,
  Lightbulb, Copy, Check, Mic, StopCircle, Download,
  Video, Loader2, X, Play, FlaskConical, Calculator,
  Atom, Code2, Brain, Zap, ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'audio' | 'simplified' | 'visual' | 'story' | 'steps' | 'examples' | 'video';

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'simplified', label: 'Simplified',   icon: FileText,  color: 'text-emerald-400' },
  { id: 'steps',      label: 'Step-by-Step', icon: List,      color: 'text-brand-400'   },
  { id: 'story',      label: 'Analogy',      icon: BookOpen,  color: 'text-amber-400'   },
  { id: 'examples',   label: 'Examples',     icon: Lightbulb, color: 'text-rose-400'    },
  { id: 'visual',     label: 'Diagram',      icon: GitBranch, color: 'text-violet-400'  },
  { id: 'audio',      label: 'Audio',        icon: Volume2,   color: 'text-cyan-400'    },
  { id: 'video',      label: 'Video Script', icon: Video,     color: 'text-pink-400'    },
];

// ── Technical subject presets ─────────────────────────────────
const SUBJECT_PRESETS = [
  {
    category: 'Mathematics',
    icon: Calculator,
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/30',
    topics: [
      { title: 'Derivatives',          subject: 'Calculus',     body: 'The derivative of a function f(x) measures the rate at which f(x) changes with respect to x. Formally, f\'(x) = lim(h→0) [f(x+h) - f(x)] / h. The derivative represents the slope of the tangent line to the curve at any point. Common rules: power rule d/dx(x^n) = nx^(n-1), product rule, chain rule for composite functions.' },
      { title: 'Integration',          subject: 'Calculus',     body: 'Integration is the reverse of differentiation. The definite integral ∫[a,b] f(x)dx represents the area under the curve f(x) from x=a to x=b. The Fundamental Theorem of Calculus states that if F is an antiderivative of f, then ∫[a,b] f(x)dx = F(b) - F(a). Techniques include substitution, integration by parts, and partial fractions.' },
      { title: 'Matrix Multiplication', subject: 'Linear Algebra', body: 'Matrix multiplication of an m×n matrix A and an n×p matrix B produces an m×p matrix C where C[i][j] = Σ A[i][k] × B[k][j] for k=1 to n. The number of columns in A must equal the number of rows in B. Matrix multiplication is not commutative: AB ≠ BA in general. It is associative: (AB)C = A(BC).' },
      { title: 'Bayes Theorem',        subject: 'Probability',  body: 'Bayes theorem states P(A|B) = P(B|A) × P(A) / P(B). It describes the probability of event A given that event B has occurred, using prior knowledge. P(A) is the prior probability, P(B|A) is the likelihood, P(B) is the marginal probability, and P(A|B) is the posterior probability. It is fundamental to Bayesian inference and machine learning.' },
    ],
  },
  {
    category: 'Physics',
    icon: Atom,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    topics: [
      { title: "Newton's Second Law",  subject: 'Physics',      body: 'F = ma states that the net force on an object equals its mass times its acceleration. Force is measured in Newtons (N = kg⋅m/s²). If multiple forces act on an object, F is the vector sum of all forces. This law explains why heavier objects require more force to accelerate at the same rate as lighter ones. It is the foundation of classical mechanics.' },
      { title: 'Wave-Particle Duality',subject: 'Quantum Physics', body: 'Wave-particle duality is the concept that every quantum entity exhibits both wave and particle properties. The de Broglie wavelength λ = h/p where h is Planck\'s constant and p is momentum. The double-slit experiment demonstrates that electrons create interference patterns (wave behavior) but are detected as individual particles. This is described by the wavefunction ψ in quantum mechanics.' },
      { title: 'Entropy',              subject: 'Thermodynamics', body: 'Entropy S is a measure of disorder or randomness in a system. The second law of thermodynamics states that the total entropy of an isolated system always increases over time: ΔS ≥ 0. For a reversible process: dS = dQ/T where dQ is heat added and T is temperature. Entropy explains why heat flows from hot to cold and why perpetual motion machines are impossible.' },
      { title: 'Electromagnetic Induction', subject: 'Physics', body: 'Faraday\'s law states that the induced EMF in a closed loop equals the negative rate of change of magnetic flux: ε = -dΦ/dt where Φ = B⋅A⋅cos(θ). Lenz\'s law states the induced current opposes the change causing it. This principle is the basis of electric generators, transformers, and induction motors. Moving a magnet through a coil generates electricity.' },
    ],
  },
  {
    category: 'Chemistry',
    icon: FlaskConical,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    topics: [
      { title: 'Chemical Equilibrium', subject: 'Chemistry',    body: 'Chemical equilibrium occurs when the rate of the forward reaction equals the rate of the reverse reaction. The equilibrium constant K = [products]^n / [reactants]^m where concentrations are raised to their stoichiometric coefficients. Le Chatelier\'s principle states that if a system at equilibrium is disturbed, it shifts to counteract the disturbance. Temperature, pressure, and concentration affect equilibrium position.' },
      { title: 'Molecular Orbital Theory', subject: 'Chemistry', body: 'Molecular orbital theory describes bonding by combining atomic orbitals to form molecular orbitals that span the entire molecule. Bonding MOs have lower energy than the original atomic orbitals; antibonding MOs (marked with *) have higher energy. Bond order = (bonding electrons - antibonding electrons) / 2. This explains why O2 is paramagnetic and why He2 does not exist.' },
    ],
  },
  {
    category: 'Computer Science',
    icon: Code2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/30',
    topics: [
      { title: 'Big O Notation',       subject: 'Computer Science', body: 'Big O notation describes the upper bound of an algorithm\'s time or space complexity as input size n grows. O(1) is constant time, O(log n) is logarithmic, O(n) is linear, O(n log n) is linearithmic, O(n²) is quadratic, O(2^n) is exponential. We drop constants and lower-order terms: 3n² + 5n + 2 = O(n²). It helps compare algorithm efficiency independent of hardware.' },
      { title: 'Recursion',            subject: 'Computer Science', body: 'Recursion is when a function calls itself to solve a smaller version of the same problem. Every recursive function needs a base case (stopping condition) and a recursive case. The call stack stores each function call until the base case is reached. Example: factorial(n) = n × factorial(n-1), base case factorial(0) = 1. Recursion can be replaced with iteration but is often more elegant for tree/graph problems.' },
      { title: 'Neural Networks',      subject: 'Machine Learning', body: 'A neural network consists of layers of neurons. Each neuron computes: output = activation(Σ(weight_i × input_i) + bias). The activation function (ReLU, sigmoid, tanh) introduces non-linearity. Training uses backpropagation: compute loss, calculate gradients using chain rule, update weights using gradient descent: w = w - α × ∂L/∂w where α is the learning rate. Deep networks have multiple hidden layers.' },
    ],
  },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="btn-ghost p-1.5" aria-label="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function DiagramView({ visual }: { visual: any }) {
  if (!visual) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="violet">{visual.diagramType}</Badge>
        <span className="text-xs text-slate-500">{visual.nodes?.length} nodes</span>
      </div>
      <div className="flex justify-center mb-4">
        <div className="px-4 py-2 rounded-xl bg-brand-600/30 border border-brand-500/50 text-sm font-semibold text-brand-300 text-center max-w-xs">
          {visual.nodes?.[0]?.label}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visual.nodes?.slice(1).map((node: any) => (
          <div key={node.id} className={cn(
            'px-3 py-2 rounded-xl border text-xs',
            node.type === 'example' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
            node.type === 'result'  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                                      'bg-surface-hover border-surface-border text-slate-300'
          )}>
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransformPage() {
  const { accessibility } = useSarvyaStore();

  const [title,   setTitle]   = useState('');
  const [body,    setBody]     = useState('');
  const [subject, setSubject] = useState('');
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('simplified');
  const [listening,    setListening]    = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [speaking,     setSpeaking]     = useState(false);
  const [videoScript,  setVideoScript]  = useState('');
  const [genVideo,     setGenVideo]     = useState(false);
  const [showPresets,  setShowPresets]  = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSttSupported(typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));
  }, []);

  // ── STT ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!sttSupported) { toast.error('Voice input not supported in this browser'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    r.onstart  = () => setListening(true);
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setBody(prev => prev ? prev + ' ' + t : t);
      toast.success('Voice captured');
    };
    r.onerror = () => { setListening(false); toast.error('Voice input failed'); };
    r.onend   = () => setListening(false);
    recognitionRef.current = r;
    r.start();
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // ── TTS ──────────────────────────────────────────────────────
  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '').replace(/\n+/g, ' '));
    utt.rate = 0.85;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  // ── Load preset ───────────────────────────────────────────────
  function loadPreset(topic: { title: string; subject: string; body: string }) {
    setTitle(topic.title);
    setSubject(topic.subject);
    setBody(topic.body);
    setShowPresets(false);
    setResult(null);
    toast.success(`Loaded: ${topic.title}`);
  }

  // ── Transform ─────────────────────────────────────────────────
  async function transform() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      const data = await api.transform.all({
        content: { title: title || 'Concept', body, subject: subject || 'General', tags: [] },
        formats: ['audio', 'simplified', 'visual'],
      });
      setResult(data);
      setActiveTab('simplified');
      if (data.isTechnical) toast.success('Technical content detected — using deep explanation mode');
      else toast.success('Content transformed!');
    } catch {
      // Fallback
      setResult({
        isTechnical: isTechFallback(body, subject),
        audio: { text: `<speak><prosody rate="slow"><p>${title || 'Concept'}.</p><break time="500ms"/><p>${body.slice(0, 300)}</p></prosody></speak>`, durationEstimate: 45, voiceStyle: 'calm' },
        simplified: { text: body.split('.').slice(0, 3).join('. ') + '.', readingLevel: 'grade-8', keyPoints: body.split('.').filter(Boolean).slice(0, 3).map((s: string) => s.trim()) },
        visual: { diagramType: 'mindmap', nodes: [{ id: 'root', label: title || 'Concept', type: 'concept' }, ...body.split('.').filter(Boolean).slice(0, 4).map((s: string, i: number) => ({ id: `n${i}`, label: s.trim().split(' ').slice(0, 5).join(' '), type: 'step' }))], edges: [] },
        storyFormat: `Think of "${title || 'this concept'}" like this: ${body.split('.')[0].trim()}. Imagine it as something you encounter every day...`,
        stepByStep: body.split('.').filter(Boolean).slice(0, 5).map((s: string, i: number) => `Step ${i + 1}: ${s.trim()}.`),
        examples: [`Real-world application 1: ${title} appears in engineering when...`, `Real-world application 2: In everyday life, you see ${title} when...`, `Real-world application 3: Scientists use ${title} to...`],
      });
      toast.success('Demo transformation applied');
    } finally { setLoading(false); }
  }

  function isTechFallback(b: string, s: string) {
    return /equation|formula|theorem|derivative|integral|matrix|quantum|algorithm/i.test(b) ||
      ['math', 'physics', 'chemistry', 'calculus', 'computer science'].some(t => s.toLowerCase().includes(t));
  }

  // ── Video script ──────────────────────────────────────────────
  async function generateVideo() {
    if (!body.trim()) return;
    setGenVideo(true);
    try {
      const res = await api.companion.chat({
        userId: 'transform-video',
        message: `Create a 90-second educational video script explaining "${title || 'this concept'}" in ${subject || 'science/math'}.

The audience is students aged 14-18 who find this topic difficult.

Format:
[SCENE 1 - 0:00-0:20] Hook — start with a surprising fact or question
[SCENE 2 - 0:20-0:50] Core explanation — use an analogy, then the real concept
[SCENE 3 - 0:50-1:10] Visual walkthrough — describe what to show on screen
[SCENE 4 - 1:10-1:30] Real-world application — where does this appear?
[SCENE 5 - 1:30-1:30] Summary — 3 key takeaways

Include [VISUAL: ...] cues for each scene.
Content: ${body}`,
        sessionKey: 'video-gen',
        communicationStyle: 'intermediate',
      });
      setVideoScript(res?.message?.content || fallbackScript());
      setActiveTab('video');
      toast.success('Video script generated!');
    } catch {
      setVideoScript(fallbackScript());
      setActiveTab('video');
      toast.success('Video script ready!');
    } finally { setGenVideo(false); }
  }

  function fallbackScript() {
    return `[SCENE 1 - 0:00-0:20] HOOK
[VISUAL: Bold question on screen]
"What if I told you that ${title || 'this concept'} is the reason your phone works, planes fly, and the internet exists?"

[SCENE 2 - 0:20-0:50] CORE EXPLANATION
[VISUAL: Simple diagram building step by step]
"${title || 'This concept'} might look scary at first, but here's the key idea: ${body.split('.')[0].trim()}."
"Think of it like ${body.split('.')[1]?.trim() || 'a simple everyday process'}."

[SCENE 3 - 0:50-1:10] VISUAL WALKTHROUGH
[VISUAL: Animated breakdown of the formula/process]
"Let's break it down step by step. First... then... finally..."

[SCENE 4 - 1:10-1:30] REAL-WORLD APPLICATION
[VISUAL: Real photos/videos of applications]
"You see ${title || 'this'} in action every time you use GPS, charge your phone, or cook food."

[SCENE 5 - 1:30-1:30] SUMMARY
[VISUAL: 3 bullet points]
"Remember: 1) ${body.split('.')[0].trim().slice(0, 60)}. 2) It applies to real life. 3) Practice makes it click."`;
  }

  // ── Download ──────────────────────────────────────────────────
  function download(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }

  function getContent(): string {
    if (!result) return '';
    switch (activeTab) {
      case 'audio':      return result.audio?.text?.replace(/<[^>]+>/g, '') || '';
      case 'simplified': return `${result.simplified?.text}\n\nKey Points:\n${result.simplified?.keyPoints?.join('\n')}`;
      case 'story':      return result.storyFormat || '';
      case 'steps':      return result.stepByStep?.join('\n') || '';
      case 'examples':   return result.examples?.join('\n\n') || '';
      case 'video':      return videoScript;
      case 'visual':     return JSON.stringify(result.visual, null, 2);
      default:           return '';
    }
  }

  const isTech = result?.isTechnical || isTechFallback(body, subject);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Accessibility Transformer"
        subtitle="Explain any technical or mathematical concept — simplified, step-by-step, analogy, audio, video"
        icon={<Wand2 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />}
        iconColor="from-pink-500 to-violet-500"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

        {/* ── INPUT ─────────────────────────────────────────── */}
        <div className="card p-4 lg:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Input</h2>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                showPresets ? 'bg-brand-600/20 border-brand-500/50 text-brand-300' : 'border-surface-border text-slate-400 hover:text-white'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              Technical Presets
              <ChevronDown className={cn('w-3 h-3 transition-transform', showPresets && 'rotate-180')} />
            </button>
          </div>

          {/* Technical presets panel */}
          <AnimatePresence>
            {showPresets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-surface border border-surface-border space-y-3">
                  {/* Category tabs */}
                  <div className="flex gap-1.5 flex-wrap">
                    {SUBJECT_PRESETS.map((cat, i) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.category}
                          onClick={() => setActiveCategory(i)}
                          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            activeCategory === i ? `${cat.bg} ${cat.color}` : 'border-surface-border text-slate-500 hover:text-white'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.category}
                        </button>
                      );
                    })}
                  </div>
                  {/* Topics */}
                  <div className="grid grid-cols-1 gap-1.5">
                    {SUBJECT_PRESETS[activeCategory].topics.map((topic) => (
                      <button
                        key={topic.title}
                        onClick={() => loadPreset(topic)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface-hover border border-surface-border hover:border-brand-500/40 text-left transition-all group"
                      >
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{topic.title}</p>
                          <p className="text-xs text-slate-500">{topic.subject}</p>
                        </div>
                        <Zap className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Topic / Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Derivatives" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Calculus" />
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Content / Formula / Concept</label>
              <div className="flex items-center gap-2">
                {isTech && body && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
                    <Brain className="w-3 h-3" /> Technical mode
                  </div>
                )}
                {sttSupported && (
                  <button
                    onClick={listening ? stopListening : startListening}
                    className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      listening ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' : 'border-surface-border text-slate-400 hover:text-white'
                    )}
                  >
                    {listening ? <><StopCircle className="w-3.5 h-3.5" /> Stop</> : <><Mic className="w-3.5 h-3.5" /> Speak</>}
                  </button>
                )}
                {body && <button onClick={() => { setBody(''); setResult(null); }} className="btn-ghost p-1.5"><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>

            <AnimatePresence>
              {listening && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
                  <span className="text-xs text-rose-300">Listening... speak your concept or formula</span>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              className="input min-h-[160px] lg:min-h-[200px] resize-none font-mono text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste any concept, formula, theorem, or equation here...

Examples:
• The derivative f'(x) = lim(h→0) [f(x+h)-f(x)]/h
• F = ma (Newton's second law)
• P(A|B) = P(B|A)P(A)/P(B) (Bayes theorem)
• Or just describe a concept in plain text"
            />
            <p className="text-xs text-slate-600 mt-1">{body.split(/\s+/).filter(Boolean).length} words</p>
          </div>

          {/* Quick topic prompts */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Quick topics:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { t: 'Pythagorean Theorem', s: 'Mathematics' },
                { t: 'Photosynthesis',      s: 'Biology'     },
                { t: 'Ohm\'s Law',          s: 'Physics'     },
                { t: 'DNA Replication',     s: 'Biology'     },
                { t: 'Recursion',           s: 'Computer Science' },
              ].map(({ t, s }) => (
                <button key={t} onClick={() => { setTitle(t); setSubject(s); }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-surface-hover border border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={transform} disabled={loading || !body.trim()} className="btn-primary flex-1 justify-center">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Transforming...</> : <><Wand2 className="w-4 h-4" /> Transform</>}
            </button>
            <button onClick={generateVideo} disabled={genVideo || !body.trim()} className="btn-secondary px-3" title="Generate video script">
              {genVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── OUTPUT ────────────────────────────────────────── */}
        <div className="card p-4 lg:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Output</h2>
              {result?.isTechnical && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
                  <Brain className="w-3 h-3" /> Deep mode
                </div>
              )}
            </div>
            {result && (
              <div className="flex items-center gap-1.5">
                {activeTab !== 'visual' && (
                  <button
                    onClick={() => speaking ? window.speechSynthesis.cancel() : speak(getContent())}
                    className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      speaking ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'border-surface-border text-slate-400 hover:text-white'
                    )}
                  >
                    {speaking ? <><StopCircle className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Play</>}
                  </button>
                )}
                <button
                  onClick={() => download(getContent(), `sarvya-${activeTab}-${(title || 'concept').replace(/\s+/g, '-').toLowerCase()}.txt`)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-surface-border text-slate-400 hover:text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                    activeTab === tab.id ? 'bg-surface-border text-white border border-surface-border' : 'text-slate-500 hover:text-white hover:bg-surface-hover'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', activeTab === tab.id ? tab.color : '')} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-[280px] lg:min-h-[360px]">
            <AnimatePresence mode="wait">
              {!result && activeTab !== 'video' ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center py-12"
                >
                  <div className="p-4 rounded-2xl bg-surface-hover border border-surface-border">
                    <Wand2 className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-400">Ready to explain anything</p>
                    <p className="text-xs text-slate-500 mt-1">Works with formulas, theorems, equations, and concepts</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {/* SIMPLIFIED */}
                  {activeTab === 'simplified' && result?.simplified && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={result.isTechnical ? 'brand' : 'emerald'}>
                            {result.isTechnical ? 'Technical Simplified' : result.simplified.readingLevel}
                          </Badge>
                        </div>
                        <CopyBtn text={result.simplified.text} />
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{result.simplified.text}</p>
                      {result.simplified.keyPoints?.length > 0 && (
                        <div className="pt-3 border-t border-surface-border">
                          <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Key Points</p>
                          <ul className="space-y-2">
                            {result.simplified.keyPoints.map((kp: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2 rounded-lg bg-surface-hover">
                                <span className="text-brand-400 shrink-0 font-bold">{i + 1}.</span>
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEPS */}
                  {activeTab === 'steps' && result?.stepByStep && (
                    <ol className="space-y-2">
                      {result.stepByStep.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover border border-surface-border">
                          <span className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                          <span className="text-sm text-slate-200 leading-relaxed">{step.replace(/^Step \d+:\s*/i, '')}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* STORY / ANALOGY */}
                  {activeTab === 'story' && result?.storyFormat && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="amber">{result.isTechnical ? 'Analogy' : 'Story'}</Badge>
                        <CopyBtn text={result.storyFormat} />
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{result.storyFormat}</p>
                      </div>
                    </div>
                  )}

                  {/* EXAMPLES */}
                  {activeTab === 'examples' && result?.examples && (
                    <div className="space-y-3">
                      {result.examples.map((ex: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-200 leading-relaxed">{ex}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VISUAL */}
                  {activeTab === 'visual' && <DiagramView visual={result?.visual} />}

                  {/* AUDIO */}
                  {activeTab === 'audio' && result?.audio && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="cyan">~{result.audio.durationEstimate}s</Badge>
                          <Badge variant="slate">slow pace</Badge>
                        </div>
                        <div className="flex gap-2">
                          <CopyBtn text={result.audio.text.replace(/<[^>]+>/g, '')} />
                          <button onClick={() => speak(result.audio.text)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-border bg-surface-hover text-slate-300 hover:text-white transition-all"
                          >
                            <Play className="w-3.5 h-3.5" /> Play
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-slate-300 bg-surface-hover p-3 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono border border-surface-border">
                        {result.audio.text}
                      </pre>
                    </div>
                  )}

                  {/* VIDEO SCRIPT */}
                  {activeTab === 'video' && (
                    <div className="space-y-3">
                      {!videoScript ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                          <Video className="w-8 h-8 text-slate-600" />
                          <div>
                            <p className="text-sm font-semibold text-slate-400">Generate a 90-second video script</p>
                            <p className="text-xs text-slate-500 mt-1">AI writes a full scene-by-scene script with visual cues</p>
                          </div>
                          <button onClick={generateVideo} disabled={genVideo || !body.trim()} className="btn-primary">
                            {genVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                            Generate Script
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="rose">90s Script</Badge>
                              <Badge variant="slate">5 scenes</Badge>
                            </div>
                            <div className="flex gap-2">
                              <CopyBtn text={videoScript} />
                              <button onClick={() => download(videoScript, `sarvya-video-${(title || 'concept').replace(/\s+/g, '-').toLowerCase()}.txt`)} className="btn-ghost p-1.5">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-slate-300 bg-surface-hover p-4 rounded-xl whitespace-pre-wrap font-mono border border-surface-border leading-relaxed">
                            {videoScript}
                          </pre>
                          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                            <p className="text-xs text-brand-300 font-semibold mb-1">Use this script with:</p>
                            <p className="text-xs text-slate-400">Canva, CapCut, Loom, or any screen recording tool. Each scene is timed for a 90-second explainer.</p>
                          </div>
                          <button onClick={generateVideo} disabled={genVideo} className="btn-secondary w-full justify-center text-sm">
                            <Loader2 className={cn('w-3.5 h-3.5', genVideo && 'animate-spin')} />
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
