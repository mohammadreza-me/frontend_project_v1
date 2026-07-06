'use client';

import { useTranslation } from '@/lib/i18n/use-translation';

export function Footer() {
  const t = useTranslation();

  return (
    <footer className="border-t bg-muted/30 py-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t.common.appName}.{' '}
          {typeof t !== 'undefined' ? '' : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          AI-Powered Adaptive Learning
        </p>
      </div>
    </footer>
  );
}