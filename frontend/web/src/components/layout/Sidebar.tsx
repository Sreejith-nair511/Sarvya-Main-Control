'use client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Brain, MessageCircle, Wand2, Activity, Cpu,
  Settings2, Gamepad2, ChevronLeft, Zap, LogOut, Map, History,
  Briefcase, BookOpen, Globe, Wifi, WifiOff,
} from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { useSarvyaStore, ActivePage } from '@/store/useSarvyaStore';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { id: ActivePage; labelKey: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard',     labelKey: 'dashboard',    icon: LayoutDashboard, color: 'text-brand-400' },
  { id: 'twin',          labelKey: 'twin',          icon: Brain,           color: 'text-violet-400' },
  { id: 'companion',     labelKey: 'companion',     icon: MessageCircle,   color: 'text-cyan-400' },
  { id: 'transform',     labelKey: 'transform',     icon: Wand2,           color: 'text-pink-400' },
  { id: 'cognitive',     labelKey: 'cognitive',     icon: Activity,        color: 'text-amber-400' },
  { id: 'hardware',      labelKey: 'hardware',      icon: Cpu,             color: 'text-emerald-400' },
  { id: 'game',          labelKey: 'game',          icon: Gamepad2,        color: 'text-orange-400' },
  { id: 'learning-map',  labelKey: 'learningMap',   icon: Map,             color: 'text-teal-400' },
  { id: 'session-replay',labelKey: 'sessionReplay', icon: History,         color: 'text-blue-400' },
  { id: 'career-os',     labelKey: 'careerOS',      icon: Briefcase,       color: 'text-purple-400' },
  { id: 'access-page',   labelKey: 'accessPage',    icon: BookOpen,        color: 'text-rose-400' },
  { id: 'accessibility', labelKey: 'accessibility', icon: Settings2,       color: 'text-slate-400' },
];

export function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, toggleSidebar, language, setLanguage, mqttConnected, realtimeConnected } = useSarvyaStore();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Learner';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-surface-card border-r border-surface-border shrink-0 overflow-hidden z-20"
      aria-label="Main navigation"
    >
      {/* Logo + connection status */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-brand">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm leading-tight">SARVYA</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={cn('w-1.5 h-1.5 rounded-full', realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')} title="Supabase Realtime" />
                <div className={cn('w-1.5 h-1.5 rounded-full', mqttConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600')} title="MQTT / Rover" />
                <span className="text-xs text-slate-500">
                  {realtimeConnected ? 'Live' : 'Connecting...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" role="navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn('nav-item w-full', isActive && 'active')}
              aria-current={isActive ? 'page' : undefined}
              title={!sidebarOpen ? t(item.labelKey) : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? item.color : 'text-slate-500')} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="truncate text-sm">
                    {t(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Language switcher */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 py-2 border-t border-surface-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Language</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                    language === lang.code
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                      : 'text-slate-500 hover:text-white hover:bg-surface-hover'
                  )}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User + sign out + collapse */}
      <div className="border-t border-surface-border p-3 space-y-2">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => signOut()}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Sign out" aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <button onClick={toggleSidebar} className="btn-ghost w-full justify-center" aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
}
