'use client';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useSarvyaStore } from '@/store/useSarvyaStore';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useSarvyaStore();

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
