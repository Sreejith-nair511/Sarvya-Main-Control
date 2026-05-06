'use client';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { Sidebar } from './Sidebar';
import { DashboardPage }    from '@/components/pages/DashboardPage';
import { TwinPage }         from '@/components/pages/TwinPage';
import { CompanionPage }    from '@/components/pages/CompanionPage';
import { TransformPage }    from '@/components/pages/TransformPage';
import { CognitivePage }    from '@/components/pages/CognitivePage';
import { HardwarePage }     from '@/components/pages/HardwarePage';
import { AccessibilityPage} from '@/components/pages/AccessibilityPage';
import { GamePage }         from '@/components/pages/GamePage';
import { LearningMapPage }  from '@/components/pages/LearningMapPage';
import { SessionReplayPage} from '@/components/pages/SessionReplayPage';
import { CareerOSPage }     from '@/components/pages/CareerOSPage';
import { AccessDocsPage }   from '@/components/pages/AccessDocsPage';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_MAP: Record<string, React.ComponentType> = {
  dashboard:      DashboardPage,
  twin:           TwinPage,
  companion:      CompanionPage,
  transform:      TransformPage,
  cognitive:      CognitivePage,
  hardware:       HardwarePage,
  accessibility:  AccessibilityPage,
  game:           GamePage,
  'learning-map': LearningMapPage,
  'session-replay': SessionReplayPage,
  'career-os':    CareerOSPage,
  'access-page':  AccessDocsPage,
};

export function DashboardShell() {
  const { activePage } = useSarvyaStore();
  const PageComponent = PAGE_MAP[activePage] || DashboardPage;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" role="main" id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-full"
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
