'use client';

import { useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useUIStore, useByokStore, useAuthStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { isRtl, localeNames, locales } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  EyeOff,
  Shield,
  Globe,
  Trash2,
  Save,
  Check,
  Moon,
  Brain,
  User,
  Camera,
  Sun,
  Monitor,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SidebarTab = 'profile' | 'appearance' | 'api-keys' | 'about';
type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

const AI_PROVIDERS: { value: AiProvider; label: string; placeholder: string }[] = [
  { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { value: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sidebar nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS: { id: SidebarTab; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', icon: User },
  { id: 'appearance', icon: Moon },
  { id: 'api-keys', icon: Shield },
  { id: 'about', icon: Brain },
];

// ---------------------------------------------------------------------------
// Section panels
// ---------------------------------------------------------------------------

function ProfilePanel() {
  const t = useTranslation();
  const locale = useUIStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const [username, setUsername] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userInitials = (username || user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={User} title={t.settings.profile} description={t.settings.profileDescription} />

      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="size-16 ring-2 ring-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold dark:bg-emerald-900 dark:text-emerald-300">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -end-1 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700 transition-colors"
            aria-label="Upload photo"
          >
            <Camera className="size-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{user?.email}</p>
          {user?.created_at && (
            <p className="text-xs text-muted-foreground">
              {t.settings.memberSince} {formatDate(user.created_at, locale)}
            </p>
          )}
        </div>
      </div>

      {/* Username field */}
      <div className="space-y-1.5">
        <Label htmlFor="username">{t.settings.username}</Label>
        <div className="flex gap-2">
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.settings.usernamePlaceholder}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
            onClick={() => toast.success(t.settings.usernameSaved)}
            disabled={!username.trim() || username.trim() === user?.name}
          >
            <Save className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppearancePanel() {
  const t = useTranslation();
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const { theme, setTheme } = useTheme();

  const themes: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: t.settings.themeLight, icon: Sun },
    { value: 'dark', label: t.settings.themeDark, icon: Moon },
    { value: 'system', label: t.settings.themeSystem, icon: Monitor },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader icon={Moon} title={t.settings.appearance} description={t.settings.appearanceDescription} />

      {/* Theme */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t.settings.darkMode}</Label>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs font-medium transition-all',
                theme === value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-border text-muted-foreground hover:border-emerald-300',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t.settings.language}</Label>
        <div className="grid grid-cols-3 gap-2">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-xs font-medium transition-all',
                locale === loc
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-border text-muted-foreground hover:border-emerald-300',
              )}
            >
              {locale === loc && <Check className="size-3 shrink-0" />}
              {localeNames[loc]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiKeysPanel() {
  const t = useTranslation();
  const { apiKey, setApiKey, clearKey, getMaskedKey } = useByokStore();

  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const currentProvider = AI_PROVIDERS.find((p) => p.value === provider)!;
  const maskedKey = getMaskedKey();

  function handleSave() {
    if (!keyInput.trim()) return;
    setApiKey(keyInput.trim());
    setKeyInput('');
    setShowKey(false);
    setKeySaved(true);
    toast.success(t.settings.keySaved);
    setTimeout(() => setKeySaved(false), 3000);
  }

  function handleClear() {
    clearKey();
    setKeyInput('');
    toast.success(t.settings.keyCleared);
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={Shield} title={t.settings.byokTitle} description={t.settings.byokDescription} iconClass="text-amber-600" />

      {/* Security notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
        {t.settings.securityWarning}
      </div>

      {/* Provider selector */}
      <div className="space-y-1.5">
        <Label>{t.settings.aiProvider}</Label>
        <Select value={provider} onValueChange={(v) => { setProvider(v as AiProvider); setKeyInput(''); setShowKey(false); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current saved key */}
      {apiKey && !keyInput && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t.settings.savedKey}</p>
            <p className="font-mono text-sm" dir="ltr">{maskedKey}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-destructive hover:text-destructive"
            onClick={handleClear}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      {/* API key input */}
      {!apiKey && (
        <div className="space-y-1.5">
          <Label htmlFor="api-key">{t.settings.apiKey}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder={currentProvider.placeholder}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                dir="ltr"
                className="pe-9 font-mono text-sm"
              />
              <button
                type="button"
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button
              size="sm"
              className={cn(
                'shrink-0 transition-colors',
                keySaved
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
              )}
              onClick={handleSave}
              disabled={!keyInput.trim()}
            >
              {keySaved ? <Check className="size-4" /> : <Save className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AboutPanel() {
  const t = useTranslation();

  return (
    <div className="space-y-5">
      <SectionHeader icon={Brain} title={t.settings.about} />

      <div className="space-y-3">
        <Row label={t.settings.version} value="0.2.0" mono />
        <Row label={t.settings.builtWithLabel} value={t.settings.builtWith} />
        <Row label="License" value="MIT" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  title,
  description,
  iconClass = 'text-emerald-600',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-1 border-b">
      <Icon className={cn('size-5 mt-0.5 shrink-0', iconClass)} />
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function SettingsPage() {
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<SidebarTab>('profile');

  const tabLabel: Record<SidebarTab, string> = {
    profile: t.settings.profile,
    appearance: t.settings.appearance,
    'api-keys': t.settings.byokTitle,
    about: t.settings.about,
  };

  const panel: Record<SidebarTab, React.ReactNode> = {
    profile: <ProfilePanel />,
    appearance: <AppearancePanel />,
    'api-keys': <ApiKeysPanel />,
    about: <AboutPanel />,
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold md:text-2xl">{t.settings.title}</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Sidebar nav */}
        <nav className="flex shrink-0 flex-row gap-1 sm:w-44 sm:flex-col">
          {NAV_ITEMS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none',
                activeTab === id
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{tabLabel[id]}</span>
            </button>
          ))}
        </nav>

        {/* Content card */}
        <Card className="flex-1">
          <CardContent className="p-5">
            {panel[activeTab]}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
