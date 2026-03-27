'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('voice-bot-language') as Language | null;
    if (saved && (saved === 'en' || saved === 'ta')) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('voice-bot-language', newLanguage);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
