'use client';
import { useUIStore } from '@/stores';
import { getMessages, type Messages } from '@/lib/i18n';

export function useTranslation(): Messages {
  const locale = useUIStore((s) => s.locale);
  return getMessages(locale);
}