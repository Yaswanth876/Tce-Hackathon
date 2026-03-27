'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn('flex gap-2', className)}>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          'px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200',
          language === 'en'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        )}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('ta')}
        className={cn(
          'px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200',
          language === 'ta'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        )}
      >
        தமிழ்
      </button>
    </div>
  );
}
