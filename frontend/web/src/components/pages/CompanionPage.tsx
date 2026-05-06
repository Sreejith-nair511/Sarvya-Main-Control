'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Mic, MicOff, RefreshCw, Bot, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  "I don't understand fractions",
  "Explain algebra step by step",
  "Give me an example of probability",
  "What is photosynthesis?",
  "How does gravity work?",
];

export function CompanionPage() {
  const { userId, twin, accessibility, companionSessionKey, companionMessages, addCompanionMessage, clearCompanion } = useSarvyaStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [topic, setTopic] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [companionMessages, sending]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput('');

    addCompanionMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });

    try {
      const res = await api.companion.chat({
        userId,
        message: text,
        sessionKey: companionSessionKey,
        communicationStyle: accessibility.communicationStyle,
        topic,
        twinState: twin,
      });

      addCompanionMessage({ role: 'assistant', content: res.message.content, timestamp: res.message.timestamp });

      if (voiceEnabled && res.voiceText && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(res.voiceText);
        utt.rate = accessibility.communicationStyle === 'beginner' ? 0.8 : 0.95;
        window.speechSynthesis.speak(utt);
      }
    } catch (e: any) {
      addCompanionMessage({
        role: 'assistant',
        content: `Sorry, I ran into an issue: ${e.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      });
      toast.error('Companion error — check console');
    } finally {
      setSending(false);
    }
  }

  const styleLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[accessibility.communicationStyle];
  const styleBadge = { beginner: 'emerald', intermediate: 'cyan', advanced: 'violet' }[accessibility.communicationStyle] as any;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen p-4 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="AI Learning Companion"
        subtitle="Powered by Groq LLaMA 3 — adapts to your level in real time"
        icon={<MessageCircle className="w-6 h-6 text-white" />}
        iconColor="from-cyan-500 to-brand-500"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={styleBadge}>{styleLabel}</Badge>
            <button onClick={() => { clearCompanion(); toast.success('New conversation started'); }} className="btn-ghost">
              <RefreshCw className="w-4 h-4" /> New
            </button>
          </div>
        }
      />

      {/* Topic */}
      {companionMessages.length === 0 && (
        <div className="mb-4">
          <input className="input" placeholder="What topic do you want to learn? (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {companionMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-brand-500/20 border border-cyan-500/20">
              <Bot className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Hi! I'm your SARVYA AI Companion</p>
              <p className="text-sm text-slate-400 mt-1">Powered by Groq · Adapts to your learning style</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)} className="px-3 py-1.5 rounded-xl text-sm bg-surface-hover border border-surface-border text-slate-300 hover:border-brand-500/50 hover:text-white transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {companionMessages.map((msg: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
                msg.role === 'user' ? 'bg-brand-600' : 'bg-gradient-to-br from-cyan-500 to-brand-500'
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={cn('max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-600/30 border border-brand-600/40 text-white rounded-tr-sm'
                  : 'bg-surface-card border border-surface-border text-slate-200 rounded-tl-sm'
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs text-slate-500 mt-1.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-brand-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-card border border-surface-border">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-slate-500"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={cn('p-2.5 rounded-xl border transition-all', voiceEnabled ? 'bg-brand-600/20 border-brand-500/50 text-brand-400' : 'bg-surface-hover border-surface-border text-slate-500 hover:text-white')}
          aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
        <input
          className="input flex-1"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          aria-label="Message input"
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending} className="btn-primary px-4" aria-label="Send">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
