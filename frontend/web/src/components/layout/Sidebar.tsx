'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Brain, MessageCircle, Wand2, Activity, Cpu,
  Settings2, Gamepad2, ChevronLeft, Zap, LogOut, Map, History,
  Briefcase, BookOpen, Globe, X, Menu,
} from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import { useSarvyaStore, ActivePage } from '@/store/useSarvyaStore';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { id: ActivePage; labelKey: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard',      labelKey: 'dashboard',    icon: LayoutDashboard, color: 'text-brand-400'  },
  { id: 'twin',           labelKey: 'twin',          icon: Brain,           color: 'text-violet-400' },
  { id: 'companion',      labelKey: 'companion',     icon: MessageCircle,   color: 'text-cyan-400'   },
  { id: 'transform',      labelKey: 'transform',     icon: Wand2,           color: 'text-pink-400'   },
  { id: 'cognitive',      labelKey: 'cognitive',     icon: Activity,        color: 'text-amber-400'  },
  { id: 'hardware',       labelKey: 'hardware',      icon: Cpu,             color: 'text-emerald-400'},
  { id: 'game',           labelKey: 'game',          icon: Gamepad2,        color: 'text-orange-400' },
  { id: 'learning-map',   labelKey: 'learningMap',   icon: Map,             color: 'text-teal-400'   },
  { id: 'session-replay', labelKey: 'sessionReplay', icon: History,         color: 'text-blue-400'   },
  { id: 'career-os',      labelKey: 'careerOS',      icon: Briefcase,       color: 'text-purple-400' },
  { id: 'access-page',    labelKey: 'accessPage',    icon: BookOpen,        color: 'text-rose-400'   },
  { id: 'accessibility',  labelKey: 'accessibility', icon: Settings2,       color: 'text-slate-400'  },
];

// Bottom nav shows only the 5 most-used pages on mobile
const BOTTOM_NAV: ActivePage[] = ['dashboard', 'twin', 'companion', 'game', 'transform'];

function NavContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { activePage, setActivePage, language, setLanguage, mqttConnected, realtimeConnected } = useSarvyaStore();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Learner';
  const initials = displayName.charAt(0).toUpperCase();

  function navigate(page: ActivePage) {
    setActivePage(page);
    onNavigate?.();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-brand">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">SARVYA</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={cn('w-1.5 h-1.5 rounded-full', realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')} />
            <div className={cn('w-1.5 h-1.5 rounded-full', mqttConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600')} />
            <span className="text-xs text-slate-500">{realtimeConnected ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" role="navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn('nav-item w-full', isActive && 'active')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive ? item.color : 'text-slate-500')} />
              <span className="truncate text-sm">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div className="px-3 py-2 border-t border-surface-border shrink-0">
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
                'px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                language === lang.code
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                  : 'text-slate-500 hover:text-white hover:bg-surface-hover'
              )}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-surface-border p-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setActivePage, activePage } = useSarvyaStore();
  const { t } = useTranslation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      // don't auto-close on desktop
    }
  }, [activePage]);

  // Close on escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && sidebarOpen) toggleSidebar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen, toggleSidebar]);

  return (
    <>
      {/* ── DESKTOP sidebar (lg+) ─────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen bg-surface-card border-r border-surface-border shrink-0 overflow-hidden z-20"
        aria-label="Main navigation"
      >
        {sidebarOpen ? (
          <NavContent />
        ) : (
          /* Collapsed icon-only view */
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center px-4 py-4 border-b border-surface-border">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    title={t(item.labelKey)}
                    className={cn(
                      'w-full flex items-center justify-center p-2.5 rounded-xl transition-all',
                      isActive
                        ? 'bg-brand-600/20 border border-brand-600/30'
                        : 'hover:bg-surface-hover'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive ? item.color : 'text-slate-500')} />
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-surface-border">
              <button
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-surface-hover text-slate-500 hover:text-white transition-all"
                aria-label="Expand sidebar"
              >
                <motion.div animate={{ rotate: 180 }} transition={{ duration: 0.2 }}>
                  <ChevronLeft className="w-4 h-4" />
                </motion.div>
              </button>
            </div>
          </div>
        )}

        {/* Collapse button when open */}
        {sidebarOpen && (
          <div className="border-t border-surface-border p-2 shrink-0">
            <button
              onClick={toggleSidebar}
              className="btn-ghost w-full justify-center py-2"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.aside>

      {/* ── MOBILE drawer overlay ─────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-surface-card border-r border-surface-border z-50 flex flex-col"
              aria-label="Mobile navigation"
            >
              {/* Close button */}
              <button
                onClick={toggleSidebar}
                className="absolute top-4 right-4 p-2 rounded-xl bg-surface-hover text-slate-400 hover:text-white z-10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <NavContent onNavigate={toggleSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Mobile top bar ────────────────────────────────────────────
export function MobileTopBar() {
  const { activePage, toggleSidebar } = useSarvyaStore();
  const { t } = useTranslation();

  const currentItem = NAV_ITEMS.find(n => n.id === activePage);
  const Icon = currentItem?.icon || LayoutDashboard;

  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-card border-b border-surface-border sticky top-0 z-30">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl bg-surface-hover text-slate-400 hover:text-white transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4', currentItem?.color || 'text-brand-400')} />
        <span className="text-sm font-semibold text-white">{t(currentItem?.labelKey || 'dashboard')}</span>
      </div>
      <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
        <Zap className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}

// ── Mobile bottom navigation bar ─────────────────────────────
export function MobileBottomNav() {
  const { activePage, setActivePage } = useSarvyaStore();
  const { t } = useTranslation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-card border-t border-surface-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {BOTTOM_NAV.map((pageId) => {
          const item = NAV_ITEMS.find(n => n.id === pageId)!;
          const Icon = item.icon;
          const isActive = activePage === pageId;
          return (
            <button
              key={pageId}
              onClick={() => setActivePage(pageId)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0',
                isActive ? 'text-white' : 'text-slate-500'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                isActive ? 'bg-brand-600/20' : ''
              )}>
                <Icon className={cn('w-5 h-5', isActive ? item.color : '')} />
              </div>
              <span className="text-[10px] font-medium truncate max-w-[52px] text-center leading-tight">
                {t(item.labelKey).split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
