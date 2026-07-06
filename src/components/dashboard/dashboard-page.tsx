'use client';

import { useMutation } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  TrendingUp,
  Flame,
  Target,
  Upload,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useUIStore, useAuthStore } from '@/stores';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { uploadDocumentApi } from '@/features/documents/api';
import { useToast } from '@/hooks/use-toast';
import type { Document as DocType } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMasteryColor(mastery: number): string {
  if (mastery < 40) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
}

// ── Metric Card Skeleton ─────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
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
  isLoading: boolean;
}

function MetricCard({ title, value, icon, iconBg, iconColor, isLoading }: MetricCardProps) {
  if (isLoading) return <MetricCardSkeleton />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`flex size-9 items-center justify-center rounded-lg ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Chart Skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ── Weekly Activity Chart ────────────────────────────────────────────────────

interface WeeklyActivityChartProps {
  data: { day: string; count: number }[] | undefined;
  isLoading: boolean;
  title: string;
  subtitle: string;
  yAxisLabel: string;
}

function WeeklyActivityChart({ data, isLoading, title, subtitle, yAxisLabel }: WeeklyActivityChartProps) {
  if (isLoading) return <ChartSkeleton />;
  const maxCount = Math.max(...(data?.map(d => d.count) ?? [1]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">{subtitle}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((item) => (
            <div key={item.day} className="flex items-center gap-3">
              <span className="w-8 text-xs text-muted-foreground text-end shrink-0">{item.day}</span>
              <div className="flex-1 h-8 rounded-md bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-md bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(item.count / maxCount) * 100}%`, minWidth: item.count > 0 ? '8px' : '0px' }}
                />
              </div>
              <span className="w-6 text-xs font-medium text-end">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Subject Distribution Pie Chart ───────────────────────────────────────────

interface SubjectDistributionChartProps {
  data: { name: string; value: number; color: string }[] | undefined;
  isLoading: boolean;
  title: string;
}

function SubjectDistributionChart({ data, isLoading, title }: SubjectDistributionChartProps) {
  if (isLoading) return <ChartSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Document Upload Zone ─────────────────────────────────────────────────────

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  dragDropText: string;
  browseFilesText: string;
  supportedFormatsText: string;
}

function UploadZone({
  onUpload,
  isUploading,
  dragDropText,
  browseFilesText,
  supportedFormatsText,
}: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed
        p-6 transition-colors
        ${isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/50'}
        ${isUploading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Upload className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <p className="text-sm text-muted-foreground">{dragDropText}</p>
      <Button type="button" variant="outline" size="sm" disabled={isUploading}>
        {isUploading ? '...' : browseFilesText}
      </Button>
      <p className="text-xs text-muted-foreground/70">{supportedFormatsText}</p>
    </div>
  );
}

// ── Document Row ─────────────────────────────────────────────────────────────

interface DocumentRowProps {
  doc: DocType;
  t: ReturnType<typeof useTranslation>;
  onClick: () => void;
}

function DocumentRow({ doc, t, onClick }: DocumentRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-start transition-colors hover:bg-muted/50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
        <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{doc.filename}</span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(doc.file_size)} · {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
        </span>
      </div>

      <Badge
        variant="outline"
        className={
          doc.status === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse'
        }
      >
        {doc.status === 'ready' ? t.dashboard.ready : t.dashboard.processing}
      </Badge>
    </button>
  );
}

// ── Activity Row ─────────────────────────────────────────────────────────────

interface ActivityRowProps {
  item: {
    id: string;
    question_text: string;
    concept_name: string;
    correct: boolean;
    answered_at: string;
    mode: 'practice' | 'exam';
  };
  t: ReturnType<typeof useTranslation>;
}

function ActivityRow({ item, t }: ActivityRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 shrink-0">
        {item.correct ? (
          <CheckCircle className="size-5 text-emerald-500" />
        ) : (
          <XCircle className="size-5 text-red-500" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm">{item.question_text}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {item.concept_name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.mode}
          </Badge>
        </div>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(item.answered_at), { addSuffix: true })}
      </span>
    </div>
  );
}

// ── Main Dashboard Page ──────────────────────────────────────────────────────

export function DashboardPage() {
  const t = useTranslation();
  const navigate = useUIStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const { stats, activity, weakConcepts, documents, weeklyActivity, subjectDistribution } = useDashboardData();

  const uploadMutation = useMutation({
    mutationFn: uploadDocumentApi,
    onSuccess: () => {
      toast({
        title: t.dashboard.uploadDocument,
        description: t.common.success,
      });
      documents.refetch();
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.common.retry,
        variant: 'destructive',
      });
    },
  });

  const userName = user?.name ?? '';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t.dashboard.welcomeBack} {userName} 👋
        </h1>
      </div>

      {/* Top Row — 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t.dashboard.totalAnswers}
          value={stats.data?.total_answers?.toLocaleString() ?? '0'}
          icon={<MessageSquare className="size-5" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          isLoading={stats.isLoading}
        />

        <MetricCard
          title={t.dashboard.successRate}
          value={stats.data ? `${stats.data.success_rate}%` : '0%'}
          icon={<TrendingUp className="size-5" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          isLoading={stats.isLoading}
        />

        <MetricCard
          title={t.dashboard.dailyStreak}
          value={stats.data ? `${stats.data.daily_streak} ${t.dashboard.days}` : `0 ${t.dashboard.days}`}
          icon={<Flame className="size-5" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          isLoading={stats.isLoading}
        />

        <MetricCard
          title={t.dashboard.questionsToday}
          value={stats.data?.questions_today?.toLocaleString() ?? '0'}
          icon={<Target className="size-5" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          isLoading={stats.isLoading}
        />
      </div>

      {/* Charts Row — Weekly Activity + Subject Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeeklyActivityChart
          data={weeklyActivity.data}
          isLoading={weeklyActivity.isLoading}
          title={t.dashboard.weeklyActivity}
          subtitle={t.dashboard.thisWeek}
          yAxisLabel={t.dashboard.questions}
        />

        <SubjectDistributionChart
          data={subjectDistribution.data}
          isLoading={subjectDistribution.isLoading}
          title={t.dashboard.subjectDistribution}
        />
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.recentDocuments}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Zone */}
          <UploadZone
            onUpload={(file) => uploadMutation.mutate(file)}
            isUploading={uploadMutation.isPending}
            dragDropText={t.dashboard.dragDrop}
            browseFilesText={t.dashboard.browseFiles}
            supportedFormatsText={t.dashboard.supportedFormats}
          />

          {/* Document List */}
          {documents.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : documents.data && documents.data.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documents.data.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  t={t}
                  onClick={() => {
                    toast({
                      title: doc.title,
                      description: t.dashboard.ready,
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t.dashboard.noDocuments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row — Weak Concepts + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Weak Concepts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.dashboard.weakConcepts}</CardTitle>
              <Button
                variant="link"
                size="sm"
                className="text-emerald-600 dark:text-emerald-400"
                onClick={() => navigate('skill-graph')}
              >
                {t.dashboard.viewAll}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {weakConcepts.isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-full" />
                ))}
              </div>
            ) : weakConcepts.data && weakConcepts.data.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weakConcepts.data.slice(0, 3).map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => navigate('skill-graph')}
                    className={`
                      inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
                      transition-colors hover:opacity-80
                      ${getMasteryColor(concept.mastery)}
                    `}
                  >
                    {concept.name}
                    <span className="text-xs opacity-75">{concept.mastery}%</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.common.noData}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <Skeleton className="size-5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : activity.data && activity.data.length > 0 ? (
              <div className="max-h-96 overflow-y-auto divide-y">
                {activity.data.slice(0, 5).map((item) => (
                  <ActivityRow key={item.id} item={item} t={t} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">{t.dashboard.noActivity}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}