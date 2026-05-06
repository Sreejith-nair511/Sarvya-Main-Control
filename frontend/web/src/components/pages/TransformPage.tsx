
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Volume2, FileText, GitBranch, BookOpen, List,
  Lightbulb, Copy, Check, Mic, MicOff, Download, Video,
  Loader2, StopCircle, Play, X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'audio' | 'simplified' | 'visual' | 'story' | 'steps' | 'examples' | 'video';

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'audio',      label: 'Audio',        icon: Volume2,   color: 'text-cyan-400'    },
  { id: 'simplified', label: 'Simplified',   icon: FileText,  color: 'text-emerald-400' },
  { id: 'visual',     label: 'Diagram',      icon: GitBranch, color: 'text-violet-400'  },
  { id: 'story',      label: 'Story',        icon: BookOpen,  color: 'text-amber-400'   },
  { id: 'steps',      label: 'Step-by-Step', icon: List,      color: 'text-brand-400'   },
  { id: 'examples',   label: 'Examples',     icon: Lightbulb, color: 'text-rose-400'    },
  { id: 'video',      label: 'Video Script', icon: Video,     color: 'text-pink-400'    },
];

const DEMO = {
  title:   'Photosynthesis',
  body:    'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct. The process takes place mainly in the leaves of plants. Light energy is absorbed by chlorophyll and used to convert carbon dioxide and water into glucose and oxygen. This glucose is used by the plant for energy and growth.',
  subject: 'Biology',
};

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
        <div className="px-4 py-2 rounded-xl bg-brand-600/30 border border-brand-500/50 text-sm font-semibold text-brand-300">
          {visual.nodes?.[0]?.label}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visual.nodes?.slice(1).map((node: any) => (
          <div key={node.id} className={cn('px-3 py-2 rounded-xl border text-xs text-center',
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

  // Input state
  const [title,   setTitle]   = useState(DEMO.title);
  const [body,    setBody]     = useState(DEMO.body);
  const [subject, setSubject] = useState(DEMO.subject);

  // Output state
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('simplified');

  // STT state
  const [listening,    setListening]    = useState(false);
  const [sttTarget,    setSttTarget]    = useState<'body' | 'title'>('body');
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TTS state
  const [speaking, setSpeaking] = useState(false);

  // Video generation state
  const [videoScript,   setVideoScript]   = useState('');
  const [generatingVid, setGeneratingVid] = useState(false);

  // Check STT support
  useEffect(() => {
    setSttSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  // ── STT ────────────────────────────────────────────────────
  const startListening = useCallback((target: 'body' | 'title') => {
    if (!sttSupported) { toast.error('Speech recognition not supported in this browser'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart  = () => { setListening(true); setSttTarget(target); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (target === 'title') setTitle(transcript);
      else setBody(prev => prev ? prev + ' ' + transcript : transcript);
      toast.success('Voice input captured');
    };
    recognition.onerror  = () => { setListening(false); toast.error('Voice input failed'); };
    recognition.onend    = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // ── TTS ────────────────────────────────────────────────────
  function speak(text: string) {
    if (!('speechSynthesis' in window)) { toast.error('TTS not supported'); return; }
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]+>/g, '').replace(/\n+/g, ' ');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = accessibility.communicationStyle === 'beginner' ? 0.8 : 0.95;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  // ── Transform ───────────────────────────────────────────────
  async function transform() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      const data = await api.transform.all({
        content: { title, body, subject, tags: [] },
        formats: ['audio', 'simplified', 'visual'],
      });
      setResult(data);
      toast.success('Content transformed!');
    } catch {
      // Fallback demo result
      setResult({
        audio: {
          text: `<speak><prosody rate="medium"><p>${title}.</p><break time="400ms"/><p>${body.slice(0, 300)}</p></prosody></speak>`,
          durationEstimate: Math.ceil(body.split(' ').length / 140 * 60),
          voiceStyle: 'calm',
        },
        simplified: {
          text: body.split('.').slice(0, 3).join('. ') + '.',
          readingLevel: 'grade-5',
          keyPoints: body.split('.').filter(Boolean).slice(0, 3).map(s => s.trim()),
        },
        visual: {
          diagramType: 'flowchart',
          nodes: [
            { id: 'root', label: title,                    type: 'concept' },
            { id: 'n1',   label: 'Uses sunlight energy',   type: 'step'    },
            { id: 'n2',   label: 'Converts CO2 + water',   type: 'step'    },
            { id: 'n3',   label: 'Produces glucose + O2',  type: 'result'  },
            { id: 'n4',   label: 'Glucose used for growth',type: 'result'  },
          ],
          edges: [],
        },
        storyFormat: `Once upon a time, in the world of ${subject}, there was a concept called "${title}".\n\n${body.slice(0, 400)}...\n\nAnd that is the story of ${title}.`,
        stepByStep: body.split('.').filter(Boolean).slice(0, 5).map((s, i) => `Step ${i + 1}: ${s.trim()}.`),
        examples: [
          `Example 1: Think about ${title} in everyday life — like how plants in your garden make food.`,
          `Example 2: In ${subject}, ${title} is why leaves are green — chlorophyll absorbs sunlight.`,
          `Example 3: A simple way to see ${title} is to put a plant in sunlight and watch it grow.`,
        ],
      });
      toast.success('Demo transformation applied');
    } finally { setLoading(false); }
  }

  // ── Video script generation ─────────────────────────────────
  async function generateVideoScript() {
    if (!body.trim()) return;
    setGeneratingVid(true);
    try {
      const res = await api.companion.chat({
        userId: 'transform-video',
        message: `Create a 60-second educational video script about "${title}" in ${subject}. 
Format it as:
[SCENE 1 - 0:00-0:15] Opening hook
[SCENE 2 - 0:15-0:35] Main explanation  
[SCENE 3 - 0:35-0:50] Visual example
[SCENE 4 - 0:50-1:00] Summary & call to action

Content to base it on: ${body}

Make it engaging, simple, and suitable for students. Include visual cues in brackets.`,
        sessionKey: 'video-gen',
        communicationStyle: 'intermediate',
      });
      const script = res?.message?.content || generateLocalVideoScript();
      setVideoScript(script);
      setActiveTab('video');
      toast.success('Video script generated!');
    } catch {
      setVideoScript(generateLocalVideoScript());
      setActiveTab('video');
      toast.success('Video script ready!');
    } finally { setGeneratingVid(false); }
  }

  function generateLocalVideoScript() {
    return `[SCENE 1 - 0:00-0:15] OPENING HOOK
[Visual: Bright green leaf in sunlight]
"Did you know that every plant around you is secretly a tiny food factory? Today we're exploring ${title}!"

[SCENE 2 - 0:15-0:35] MAIN EXPLANATION
[Visual: Animated diagram of chloroplast]
"${body.split('.')[0].trim()}. ${body.split('.')[1]?.trim() || ''}."
[Visual: Arrow showing sunlight → chlorophyll → glucose]

[SCENE 3 - 0:35-0:50] REAL-WORLD EXAMPLE
[Visual: Garden plants, forest, food on a plate]
"Every time you eat a vegetable or fruit, you're eating the result of ${title}. The plant made that food using nothing but sunlight, water, and air!"

[SCENE 4 - 0:50-1:00] SUMMARY
[Visual: Key points appear on screen]
"So remember: ${title} = sunlight + CO2 + water → glucose + oxygen. Plants feed the world!"
[End card with SARVYA logo]`;
  }

  // ── Download helpers ────────────────────────────────────────
  function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }

  function downloadHTML(content: string, filename: string) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title} — SARVYA</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#1a1a2e}
h1{color:#4f46e5}pre{background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap}</style>
</head><body><h1>${title}</h1><p><strong>Subject:</strong> ${subject}</p><hr/>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }

  function getDownloadContent(): string {
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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="One-Click Accessibility Transformer"
        subtitle="Voice input, AI transformation, download & video script generation"
        icon={<Wand2 className="w-6 h-6 text-white" />}
        iconColor="from-pink-500 to-violet-500"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── INPUT PANEL ─────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Input Content</h2>
            {sttSupported && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mic className="w-3.5 h-3.5" />
                <span>Voice input enabled</span>
              </div>
            )}
          </div>

          {/* Title row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Title</label>
              <div className="relative">
                <input
                  className="input pr-8"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Topic title"
                />
                {sttSupported && (
                  <button
                    onClick={() => listening && sttTarget === 'title' ? stopListening() : startListening('title')}
                    className={cn('absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all',
                      listening && sttTarget === 'title' ? 'text-rose-400 animate-pulse' : 'text-slate-500 hover:text-brand-400'
                    )}
                    title="Voice input for title"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            </div>
          </div>

          {/* Body with STT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Content Body</label>
              <div className="flex items-center gap-2">
                {sttSupported && (
                  <button
                    onClick={() => listening && sttTarget === 'body' ? stopListening() : startListening('body')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      listening && sttTarget === 'body'
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                        : 'bg-surface-hover border-surface-border text-slate-400 hover:text-white hover:border-brand-500/40'
                    )}
                  >
                    {listening && sttTarget === 'body'
                      ? <><StopCircle className="w-3.5 h-3.5" /> Stop</>
                      : <><Mic className="w-3.5 h-3.5" /> Speak</>
                    }
                  </button>
                )}
                {body && (
                  <button onClick={() => setBody('')} className="btn-ghost p-1.5" title="Clear">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* STT live indicator */}
            <AnimatePresence>
              {listening && sttTarget === 'body' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
                  <span className="text-xs text-rose-300">Listening... speak now</span>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              className="input min-h-[180px] resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste content or click Speak to use voice input..."
            />
            <p className="text-xs text-slate-600 mt-1">{body.split(/\s+/).filter(Boolean).length} words</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={transform}
              disabled={loading || !body.trim()}
              className="btn-primary flex-1 justify-center"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Transforming...</>
                : <><Wand2 className="w-4 h-4" /> Transform</>
              }
            </button>
            <button
              onClick={generateVideoScript}
              disabled={generatingVid || !body.trim()}
              className="btn-secondary px-4"
              title="Generate video script"
            >
              {generatingVid
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Video className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Quick prompts for STT */}
          {sttSupported && (
            <div className="pt-2 border-t border-surface-border">
              <p className="text-xs text-slate-500 mb-2">Quick voice prompts:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Explain photosynthesis',
                  'What is gravity?',
                  'How does the heart work?',
                  'Explain the water cycle',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setBody(prompt); setTitle(prompt.replace(/^(explain|what is|how does)\s+/i, '')); }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-surface-hover border border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── OUTPUT PANEL ────────────────────────────────── */}
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Transformed Output</h2>
            {result && (
              <div className="flex items-center gap-2">
                {/* TTS play/stop */}
                {activeTab !== 'visual' && activeTab !== 'video' && (
                  <button
                    onClick={() => speaking ? stopSpeaking() : speak(getDownloadContent())}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      speaking
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-surface-hover border-surface-border text-slate-400 hover:text-white'
                    )}
                  >
                    {speaking ? <><StopCircle className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Play</>}
                  </button>
                )}
                {/* Download */}
                <button
                  onClick={() => downloadText(getDownloadContent(), `sarvya-${activeTab}-${title.replace(/\s+/g, '-').toLowerCase()}.txt`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-border bg-surface-hover text-slate-400 hover:text-white transition-all"
                  title="Download as text"
                >
                  <Download className="w-3.5 h-3.5" /> TXT
                </button>
                <button
                  onClick={() => downloadHTML(`<pre>${getDownloadContent()}</pre>`, `sarvya-${activeTab}-${title.replace(/\s+/g, '-').toLowerCase()}.html`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-border bg-surface-hover text-slate-400 hover:text-white transition-all"
                  title="Download as HTML"
                >
                  <Download className="w-3.5 h-3.5" /> HTML
                </button>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const hasContent = tab.id === 'video' ? !!videoScript : !!result;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all relative',
                    activeTab === tab.id
                      ? 'bg-surface-border text-white border border-surface-border'
                      : 'text-slate-500 hover:text-white hover:bg-surface-hover'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', activeTab === tab.id ? tab.color : '')} />
                  {tab.label}
                  {hasContent && tab.id === 'video' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            <AnimatePresence mode="wait">
              {!result && activeTab !== 'video' ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 gap-4 text-center"
                >
                  <div className="p-4 rounded-2xl bg-surface-hover border border-surface-border">
                    <Wand2 className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-400">Ready to transform</p>
                    <p className="text-xs text-slate-500 mt-1">Enter content or use voice input, then click Transform</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {/* AUDIO */}
                  {activeTab === 'audio' && result?.audio && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="cyan">~{result.audio.durationEstimate}s</Badge>
                          <Badge variant="slate">{result.audio.voiceStyle}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <CopyBtn text={result.audio.text.replace(/<[^>]+>/g, '')} />
                          <button
                            onClick={() => speaking ? stopSpeaking() : speak(result.audio.text)}
                            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                              speaking ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'btn-secondary'
                            )}
                          >
                            {speaking ? <><StopCircle className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Play Audio</>}
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-slate-300 bg-surface-hover p-3 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono border border-surface-border">
                        {result.audio.text}
                      </pre>
                    </div>
                  )}

                  {/* SIMPLIFIED */}
                  {activeTab === 'simplified' && result?.simplified && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="emerald">{result.simplified.readingLevel}</Badge>
                        <CopyBtn text={result.simplified.text} />
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{result.simplified.text}</p>
                      {result.simplified.keyPoints?.length > 0 && (
                        <div className="pt-3 border-t border-surface-border">
                          <p className="text-xs text-slate-500 mb-2">Key Points:</p>
                          <ul className="space-y-1.5">
                            {result.simplified.keyPoints.map((kp: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-emerald-400 shrink-0">•</span><span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISUAL */}
                  {activeTab === 'visual' && <DiagramView visual={result?.visual} />}

                  {/* STORY */}
                  {activeTab === 'story' && result?.storyFormat && (
                    <div className="space-y-2">
                      <div className="flex justify-end"><CopyBtn text={result.storyFormat} /></div>
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{result.storyFormat}</p>
                    </div>
                  )}

                  {/* STEPS */}
                  {activeTab === 'steps' && result?.stepByStep && (
                    <ol className="space-y-2">
                      {result.stepByStep.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover">
                          <span className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                          <span className="text-sm text-slate-200">{step.replace(/^Step \d+:\s*/i, '')}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* EXAMPLES */}
                  {activeTab === 'examples' && result?.examples && (
                    <div className="space-y-3">
                      {result.examples.map((ex: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-200">{ex}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VIDEO SCRIPT */}
                  {activeTab === 'video' && (
                    <div className="space-y-3">
                      {!videoScript ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                          <Video className="w-8 h-8 text-slate-600" />
                          <div>
                            <p className="text-sm font-semibold text-slate-400">Generate a video script</p>
                            <p className="text-xs text-slate-500 mt-1">Click the video button to create a 60-second script</p>
                          </div>
                          <button onClick={generateVideoScript} disabled={generatingVid || !body.trim()} className="btn-primary">
                            {generatingVid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                            Generate Video Script
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="rose">60s Script</Badge>
                              <Badge variant="slate">4 scenes</Badge>
                            </div>
                            <div className="flex gap-2">
                              <CopyBtn text={videoScript} />
                              <button
                                onClick={() => downloadText(videoScript, `sarvya-video-script-${title.replace(/\s+/g, '-').toLowerCase()}.txt`)}
                                className="btn-ghost p-1.5" title="Download script"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-slate-300 bg-surface-hover p-4 rounded-xl whitespace-pre-wrap font-mono border border-surface-border leading-relaxed">
                            {videoScript}
                          </pre>
                          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                            <p className="text-xs text-brand-300 font-semibold mb-1">How to use this script:</p>
                            <p className="text-xs text-slate-400">Use this script with tools like Canva, CapCut, or Loom to create your video. Each scene is timed for a 60-second explainer video.</p>
                          </div>
                          <button
                            onClick={generateVideoScript}
                            disabled={generatingVid}
                            className="btn-secondary w-full justify-center text-sm"
                          >
                            <Loader2 className={cn('w-3.5 h-3.5', generatingVid && 'animate-spin')} />
                            Regenerate Script
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
