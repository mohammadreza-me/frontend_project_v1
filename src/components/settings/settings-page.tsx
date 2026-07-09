'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useUIStore, useByokStore, useAuthStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { isRtl, localeNames, locales } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Shield, Globe, Trash2, Save, Check, Moon, Brain, User } from 'lucide-react';
import { toast } from 'sonner';
import type { Locale, ByokScope } from '@/types';

function formatDate(dateStr: string, locale: Locale): string {
  try {
    const date = new Date(dateStr);
    const localeMap: Record<Locale, string> = { en: 'en-US', fa: 'fa-IR', ar: 'ar-SA' };
    return date.toLocaleDateString(localeMap[locale], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function SettingsPage() {
  const t = useTranslation();
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);
  const {
    apiKey,
    scope,
    setApiKey,
    setScope,
    clearKey,
    getMaskedKey,
  } = useByokStore();
  const { theme, setTheme } = useTheme();

  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    setApiKey(keyInput.trim());
    setKeyInput('');
    setShowKey(false);
    setKeySaved(true);
    toast.success(t.settings.keySaved);
    setTimeout(() => setKeySaved(false), 3000);
  };

  const handleClearKey = () => {
    clearKey();
    setKeyInput('');
    toast.success(t.settings.keyCleared);
  };

  const handleScopeChange = (newScope: string) => {
    setScope(newScope as ByokScope);
  };

  const maskedKey = getMaskedKey();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t.settings.title}</h1>

      {/* Profile Section */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-5 text-emerald-600" />
              {t.settings.profile}
            </CardTitle>
            <CardDescription>{t.settings.profileDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold dark:bg-emerald-900 dark:text-emerald-300">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-lg font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {t.settings.memberSince}{' '}
                  {formatDate(user.created_at, locale)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="size-5 text-emerald-600" />
            {t.settings.language}
          </CardTitle>
          <CardDescription>{t.settings.languageDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`rounded-lg border-2 p-4 text-center transition-all ${
                  locale === loc
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-border hover:border-emerald-300'
                }`}
              >
                <p className="font-medium">{localeNames[loc]}</p>
                {locale === loc && (
                  <Check className="mx-auto mt-1 size-4 text-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="size-5 text-emerald-600" />
            {t.settings.darkMode}
          </CardTitle>
          <CardDescription>{t.settings.darkModeDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-switch" className="cursor-pointer">
              {t.settings.darkMode}
            </Label>
            <Switch
              id="dark-mode-switch"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* BYOK Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5 text-amber-600" />
            {t.settings.byokTitle}
          </CardTitle>
          <CardDescription>{t.settings.byokDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Warning */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t.settings.securityWarning}
            </p>
          </div>

          {/* Current Key Display */}
          {apiKey && !keyInput && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-xs text-muted-foreground">{t.settings.apiKey}</p>
                <p className="font-mono text-sm" dir="ltr">{maskedKey}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleClearKey}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}

          {/* Key Input */}
          {!apiKey && (
            <div className="space-y-2">
              <Label htmlFor="api-key">{t.settings.apiKey}</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder={t.settings.apiKeyPlaceholder}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  dir="ltr"
                  className="pe-10 text-start font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 -translate-y-1/2 size-8"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
              >
                <Save className="size-4 me-2" />
                {t.settings.saveKey}
              </Button>
            </div>
          )}

          <Separator />

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label>{t.settings.keyScope}</Label>
            <Select value={scope} onValueChange={handleScopeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question_generation">
                  {t.settings.scopeQuestion}
                </SelectItem>
                <SelectItem value="career_simulation">
                  {t.settings.scopeCareer}
                </SelectItem>
                <SelectItem value="both">
                  {t.settings.scopeBoth}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="size-5 text-emerald-600" />
            {t.settings.about}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t.settings.builtWith}
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {t.settings.version} 0.2.0
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}