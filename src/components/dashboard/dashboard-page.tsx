'use client';


import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useUIStore, useAuthStore } from '@/stores';
import { useWorkspaces, useCreateWorkspace } from '@/features/workspaces/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  TrendingUp,
  Target,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import type { Workspace } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '📐', '🌐', '🗃️', '🤖', '🧬', '💻',
  '📊', '🔬', '🎵', '📚', '⚡', '🌍',
];

const WEEKLY_MOCK_DATA = [
  { day: 'Mon', count: 12 },
  { day: 'Tue', count: 19 },
  { day: 'Wed', count: 8 },
  { day: 'Thu', count: 25 },
  { day: 'Fri', count: 15 },
  { day: 'Sat', count: 22 },
  { day: 'Sun', count: 10 },
];

const MOCK_SUCCESS_RATE = 72.5;
const MOCK_QUESTIONS_TODAY = 15;

// ── Metric Card Skeleton ─────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <Card className="p-4 gap-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
    </Card>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function MetricCard({ title, value, icon, iconBg, iconColor }: MetricCardProps) {
  return (
    <Card className="p-4 gap-0 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`flex size-9 items-center justify-center rounded-lg ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

// ── Workspace Card Skeleton ──────────────────────────────────────────────────

function WorkspaceCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}

// ── Workspace Card ───────────────────────────────────────────────────────────

interface WorkspaceCardProps {
  ws: Workspace;
  questionsLabel: string;
  conceptsLabel: string;
  documentsLabel: string;
  coverageLabel: string;
  onClick: () => void;
}

function WorkspaceCard({
  ws,
  questionsLabel,
  conceptsLabel,
  documentsLabel,
  coverageLabel,
  onClick,
}: WorkspaceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border bg-card p-4 text-start transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
    >
      {/* Icon + Name + Coverage */}
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 text-5xl leading-none"
          role="img"
          aria-label={ws.name}
        >
          {ws.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{ws.name}</h3>

          {/* Mini coverage bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${ws.coverage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {ws.coverage}% {coverageLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>
          {ws.questionCount} {questionsLabel}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span>
          {ws.conceptCount} {conceptsLabel}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span>
          {ws.documentCount} {documentsLabel}
        </span>
      </div>
    </button>
  );
}

// ── Weekly Activity Chart (CSS-only) ────────────────────────────────────────

interface WeeklyChartProps {
  data: { day: string; count: number }[];
  title: string;
  subtitle: string;
}

function WeeklyActivityChart({ data, title, subtitle }: WeeklyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {subtitle}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.map((item) => (
          <div key={item.day} className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-xs text-muted-foreground text-end font-medium">
              {item.day}
            </span>
            <div className="h-7 flex-1 overflow-hidden rounded-md bg-muted/50">
              <div
                className="h-full rounded-md bg-emerald-500 transition-all duration-700 ease-out"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  minWidth: item.count > 0 ? '8px' : '0px',
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-xs font-semibold text-end tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard Page ──────────────────────────────────────────────────────

export function DashboardPage() {
  const t = useTranslation();
  const navigate = useUIStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);

  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📐');

  const userName = user?.name ?? '';

  // Computed stats from workspace data
  const totalAnswers = useMemo(() => {
    if (!workspaces) return 0;
    return workspaces.reduce((sum, ws) => sum + ws.questionCount, 0);
  }, [workspaces]);

  const activeWorkspacesCount = workspaces?.length ?? 0;

  const handleCreate = () => {
    if (!workspaceName.trim()) return;
    createWorkspace.mutate(
      { name: workspaceName.trim(), icon: selectedEmoji },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setWorkspaceName('');
          setSelectedEmoji('📐');
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && workspaceName.trim() && !createWorkspace.isPending) {
      handleCreate();
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* ── Welcome Bar ─────────────────────────────────────────────────── */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t.dashboard.welcomeBack}, {userName} 👋
        </h1>
      </header>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 gap-4"
        aria-label={t.dashboard.title}
      >
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title={t.dashboard.totalAnswers}
              value={totalAnswers.toLocaleString()}
              icon={<MessageSquare className="size-5" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              title={t.dashboard.successRate}
              value={`${MOCK_SUCCESS_RATE}%`}
              icon={<TrendingUp className="size-5" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              title={t.dashboard.activeWorkspaces}
              value={String(activeWorkspacesCount)}
              icon={<LayoutGrid className="size-5" />}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <MetricCard
              title={t.dashboard.questionsToday}
              value={String(MOCK_QUESTIONS_TODAY)}
              icon={<Target className="size-5" />}
              iconBg="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </section>

      {/* ── Workspaces Section ──────────────────────────────────────────── */}
      <section aria-label={t.dashboard.activeWorkspaces}>
        {/* Header row with title + create button */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.dashboard.activeWorkspaces}</h2>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="size-4" />
                {t.dashboard.newWorkspace}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.dashboard.newWorkspace}</DialogTitle>
                <DialogDescription>
                  {t.dashboard.createFirst}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Name input */}
                <div className="space-y-2">
                  <Label htmlFor="ws-name-input">
                    {t.dashboard.workspaceName}
                  </Label>
                  <Input
                    id="ws-name-input"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.dashboard.workspaceNamePlaceholder}
                    autoFocus
                  />
                </div>

                {/* Emoji icon picker */}
                <div className="space-y-2">
                  <Label>{t.dashboard.workspaceIcon}</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={[
                          'flex size-11 items-center justify-center rounded-lg border-2 text-2xl transition-colors hover:bg-muted/50',
                          selectedEmoji === emoji
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-transparent',
                        ].join(' ')}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !workspaceName.trim() || createWorkspace.isPending
                  }
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {createWorkspace.isPending
                    ? t.dashboard.creating
                    : t.dashboard.create}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workspace cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <WorkspaceCardSkeleton key={i} />
            ))}
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                ws={ws}
                questionsLabel={t.common.questions}
                conceptsLabel={t.dashboard.concepts}
                documentsLabel={t.dashboard.documents}
                coverageLabel={t.dashboard.coverage}
                onClick={() =>
                  navigate('workspace', { workspaceId: ws.id })
                }
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/50">
                <LayoutGrid className="size-8 text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium">
                {t.dashboard.noWorkspaces}
              </p>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                {t.dashboard.createFirst}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-4" />
                {t.dashboard.newWorkspace}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Weekly Activity ─────────────────────────────────────────────── */}
      <section aria-label={t.dashboard.weeklyActivity}>
        <WeeklyActivityChart
          data={WEEKLY_MOCK_DATA}
          title={t.dashboard.weeklyActivity}
          subtitle={t.dashboard.thisWeek}
        />
      </section>
    </div>
  );
}