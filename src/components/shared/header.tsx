'use client';

import { useUIStore, useAuthStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { isRtl, localeNames, locales } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { AppPage, Locale } from '@/types';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  LogOut,
  Menu,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';

interface NavItem {
  page: AppPage;
  labelKey: keyof typeof import('@/messages/en.json').nav;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { page: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { page: 'knowledge-graph', labelKey: 'knowledgeGraph', icon: GitBranch },
  { page: 'settings', labelKey: 'settings', icon: Settings },
];

export function Header() {
  const t = useTranslation();
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const currentPage = useUIStore((s) => s.currentPage);
  const navigate = useUIStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isMobile = useIsMobile();
  const rtl = isRtl(locale);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('login');
  };

  const handleLocaleChange = (value: string) => {
    setLocale(value as Locale);
  };

  const navLinkClass = (page: AppPage) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      currentPage === page
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  // Mobile: hamburger + Sheet
  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {t.common.appName}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
              <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Select value={locale} onValueChange={handleLocaleChange}>
              <SelectTrigger size="sm" className="w-auto gap-1">
                <Globe className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {localeNames[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={rtl ? 'left' : 'right'} className="w-72 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-start">{t.common.appName}</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col gap-1">
                  {navItems.map(({ page, labelKey, icon: Icon }) => (
                    <button
                      key={page}
                      onClick={() => navigate(page)}
                      className={navLinkClass(page)}
                    >
                      <Icon className="size-4" />
                      {t.nav[labelKey]}
                    </button>
                  ))}
                </nav>
                <Separator className="my-4" />
                {user && (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900 dark:text-emerald-300">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="ms-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-1"
                >
                  <LogOut className="size-4" />
                  {t.nav.logout}
                </button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    );
  }

  // Desktop
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-6">
        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 me-6">
          {t.common.appName}
        </span>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ page, labelKey, icon: Icon }) => (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={navLinkClass(page)}
            >
              <Icon className="size-4" />
              {t.nav[labelKey]}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger size="sm" className="w-auto gap-1">
              <Globe className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {localeNames[loc]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user && (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900 dark:text-emerald-300">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4" />
                {t.nav.logout}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}