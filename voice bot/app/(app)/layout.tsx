'use client';

import { LanguageProvider } from '@/context/LanguageContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
