'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useUIStore } from '@/stores';
import { isRtl } from '@/lib/i18n';
import { Toaster } from '@/components/ui/sonner';

function DirUpdater() {
  const locale = useUIStore((s) => s.locale);

  useEffect(() => {
    const dir = isRtl(locale) ? 'rtl' : 'ltr';
    const lang = locale;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [locale]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <DirUpdater />
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}