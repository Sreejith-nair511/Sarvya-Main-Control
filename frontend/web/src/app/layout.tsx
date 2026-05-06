import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { AccessibilityWrapper } from '@/components/layout/AccessibilityWrapper';
import { I18nProvider } from '@/components/layout/I18nProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SARVYA Control Center',
  description: 'Inclusive, accessibility-first AI learning ecosystem — real-time adaptive intelligence',
};

export const viewport = {
  themeColor: '#0f0f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans bg-surface text-white`}>
          <I18nProvider>
            <AccessibilityWrapper>
              {children}
            </AccessibilityWrapper>
          </I18nProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#16162a',
                color: '#fff',
                border: '1px solid #2a2a45',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
