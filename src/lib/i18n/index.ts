import fa from '@/messages/fa.json';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import type { Locale } from '@/types';

export type Messages = typeof fa;

const messageMap: Record<Locale, Messages> = { fa, en, ar };

export function getMessages(locale: Locale): Messages {
  return messageMap[locale] ?? messageMap.fa;
}

export function isRtl(locale: Locale): boolean {
  return locale === 'fa' || locale === 'ar';
}

export const localeNames: Record<Locale, string> = {
  fa: 'فارسی',
  en: 'English',
  ar: 'العربية',
};

export const locales: Locale[] = ['fa', 'en', 'ar'];