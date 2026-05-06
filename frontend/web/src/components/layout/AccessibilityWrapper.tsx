'use client';
import { useEffect } from 'react';
import { useSarvyaStore } from '@/store/useSarvyaStore';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { accessibility } = useSarvyaStore();

  useEffect(() => {
    const root = document.documentElement;
    // Remove all mode classes first
    root.classList.remove(
      'mode-high-contrast', 'mode-large-text',
      'mode-reduced-motion', 'mode-voice-first', 'mode-simplified'
    );
    // Apply active modes
    if (accessibility.highContrast)    root.classList.add('mode-high-contrast');
    if (accessibility.largeText)       root.classList.add('mode-large-text');
    if (accessibility.reducedMotion)   root.classList.add('mode-reduced-motion');
    if (accessibility.mode === 'voice-first')   root.classList.add('mode-voice-first');
    if (accessibility.mode === 'simplified')    root.classList.add('mode-simplified');

    // Font size CSS variable
    root.style.setProperty('--font-size-base', `${accessibility.fontSize}px`);
  }, [accessibility]);

  return <>{children}</>;
}
