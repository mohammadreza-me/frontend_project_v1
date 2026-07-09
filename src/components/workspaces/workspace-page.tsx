'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { useUIStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import {
  useWorkspaceStats,
  useWorkspaceCoverage,
  useWorkspaceTags,
  useConceptTree,
  useConceptHistory,
  useWorkspaces,
} from '@/features/workspaces/hooks';
import {
  getDocumentsApi,
  suggestTagsApi,
  uploadDocumentApi,
} from '@/features/documents/api';
import { generateQuestionsApi } from '@/features/questions/api';
import type {
  WorkspaceTab as WorkspaceTabType,
  ConceptTreeNode,
  ConceptQuestionHistory,
  DocumentWithWorkspace,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Upload,
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  BarChart3,
  Target,
  AlertTriangle,
  X,
  Loader2,
  TreePine,
  FolderOpen,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getMasteryColor(m: number) {
  if (m > 70) return 'bg-emerald-500 text-emerald-100';
  if (m >= 40) return 'bg-yellow-500 text-yellow-100';
  return 'bg-red-500 text-red-100';
}

function getMasteryBarColor(m: number) {
  if (m > 70) return 'bg-emerald-500';
  if (m >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getMasteryTextColor(m: number) {
  if (m > 70) return 'text-emerald-600';
  if (m >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

/* ------------------------------------------------------------------ */
/*  SVG Radar Chart                                                   */
/* ------------------------------------------------------------------ */

function RadarChart({
  data,
}: {
  data: { name: string; mastery: number }[];
}) {
  const n = data.length;
  if (n < 3) return null;

  const cx = 150;
  const cy = 150;
  const r = 100;
  const angleStep = (2 * Math.PI) / n;
  const levels = [0.25, 0.5, 0.75, 1.0];

  function polarToCart(angle: number, radius: number) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function gridPoints(level: number) {
    return Array.from({ length: n }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const pt = polarToCart(angle, r * level);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  }

  const dataPoints = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return polarToCart(angle, (d.mastery / 100) * r);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labels = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const lp = polarToCart(angle, r + 24);
    const cos = Math.cos(angle);
    let anchor: string = 'middle';
    if (cos > 0.3) anchor = 'start';
    else if (cos < -0.3) anchor = 'end';
    return { ...lp, text: d.name, anchor };
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
      {/* Grid polygons */}
      {levels.map((lv, li) => (
        <polygon
          key={li}
          points={gridPoints(lv)}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/20"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const pt = polarToCart(angle, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            className="stroke-muted-foreground/20"
            strokeWidth="1"
          />
        );
      })}

      {/* Data fill */}
      <polygon
        points={dataPolygon}
        fill="rgba(16,185,129,0.25)"
        stroke="#10b981"
        strokeWidth="2"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#10b981" />
      ))}

      {/* Labels */}
      {labels.map((lb, i) => (
        <text
          key={i}
          x={lb.x}
          y={lb.y}
          textAnchor={lb.anchor}
          dominantBaseline="central"
          className="fill-muted-foreground"
          fontSize="10"
          fontWeight="500"
        >
          {lb.text}
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Concept History (expandable in tree tab)                          */
/* ------------------------------------------------------------------ */

function ConceptHistorySection({
  conceptName,
}: {
  conceptName: string;
}) {
  const t = useTranslation();
  const { data: history, isLoading } = useConceptHistory(conceptName);

  return (
    <div className="ps-8 pt-2 pb-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t.workspace.previousQuestions}
      </p>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !history || history.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3">
          {t.workspace.noPreviousQuestions}
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {history.map((h: ConceptQuestionHistory) => (
            <div
              key={h.id}
              className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm"
            >
              {h.correct ? (
                <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="size-4 mt-0.5 shrink-0 text-red-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="leading-snug">{h.questionText}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${h.correct ? 'border-emerald-300 text-emerald-600' : 'border-red-300 text-red-600'}`}
                  >
                    {h.correct ? t.workspace.correct : t.workspace.incorrect}
                  </Badge>
                  <span className="ms-2">
                    {new Date(h.answeredAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function WorkspacePage() {
  const t = useTranslation();
  const qc = useQueryClient();
  const pageParams = useUIStore((s) => s.pageParams);
  const workspaceId = pageParams.workspaceId;
  const workspaceTab = useUIStore((s) => s.workspaceTab);
  const setWorkspaceTab = useUIStore(
    (s) => s.setWorkspaceTab,
  );
  const navigate = useUIStore((s) => s.navigate);

  /* ----- Data hooks ----- */
  const { data: workspaces } = useWorkspaces();
  const currentWorkspace = workspaces?.find((w) => w.id === workspaceId);

  const { data: stats, isLoading: statsLoading } = useWorkspaceStats(
    workspaceId ?? null,
  );
  const { data: coverage } = useWorkspaceCoverage(workspaceId ?? null);
  const { data: workspaceTags } = useWorkspaceTags(workspaceId ?? null);
  const { data: conceptTree, isLoading: treeLoading } = useConceptTree(
    workspaceId ?? null,
  );
  const {
    data: documents,
    isLoading: docsLoading,
  } = useQuery({
    queryKey: ['documents', workspaceId],
    queryFn: () => getDocumentsApi(workspaceId),
    enabled: !!workspaceId,
  });

  /* ----- Practice tab state ----- */
  const [practiceMode, setPracticeMode] = useState<'practice' | 'exam'>(
    'practice',
  );
  const [practiceDifficulty, setPracticeDifficulty] = useState<
    'easy' | 'medium' | 'hard'
  >('medium');
  const [practiceScope, setPracticeScope] = useState<
    'entire' | 'file' | 'concept'
  >('entire');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedConcept, setSelectedConcept] = useState('');

  /* ----- Tree tab state ----- */
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  /* ----- Resources tab state ----- */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);

  /* ----- Mutations ----- */
  const suggestTagsMutation = useMutation({
    mutationFn: suggestTagsApi,
    onSuccess: (tags) => setAiTags(tags),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocumentApi(file, workspaceId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', workspaceId] });
      qc.invalidateQueries({ queryKey: ['workspace-stats', workspaceId] });
      setSelectedFile(null);
      setAiTags([]);
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: () => {
      const docId = practiceScope === 'file' ? selectedFileId : undefined;
      const conceptIds =
        practiceScope === 'concept' ? [selectedConcept] : undefined;
      return generateQuestionsApi(docId, conceptIds, 5, practiceMode);
    },
    onSuccess: () => {
      navigate(practiceMode === 'exam' ? 'exam' : 'practice', {
        workspaceId: workspaceId ?? '',
      });
    },
  });

  /* ----- Dropzone ----- */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        suggestTagsMutation.mutate(acceptedFiles[0].name);
      }
    },
  });

  /* ----- Handlers ----- */
  const handleFilterByConcept = (conceptName: string) => {
    setPracticeScope('concept');
    setSelectedConcept(conceptName);
    setWorkspaceTab('practice');
  };

  const handlePracticeFromFile = (fileId: string) => {
    setPracticeScope('file');
    setSelectedFileId(fileId);
    setWorkspaceTab('practice');
  };

  const isReviewAvailable = coverage?.ready_for_review === true;
  const startLabel = isReviewAvailable
    ? t.workspace.startReview
    : t.workspace.startButton;

  /* ----- Tab definitions ----- */
  const tabs: { key: WorkspaceTabType; label: string }[] = [
    { key: 'status', label: t.workspace.myStatus },
    { key: 'practice', label: t.workspace.startPractice },
    { key: 'tree', label: t.workspace.knowledgeTree },
    { key: 'resources', label: t.workspace.myResources },
  ];

  /* ----- Deduplicated tags for upload ----- */
  const dedupedAiTags = useMemo(() => {
    const wsTagNames = new Set(workspaceTags?.map((t) => t.tag) ?? []);
    return aiTags.filter((tag) => !wsTagNames.has(tag));
  }, [aiTags, workspaceTags]);

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  if (!workspaceId) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('dashboard')}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t.workspace.backToDashboard}
        </button>

        {/* Custom tab bar */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-none"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={workspaceTab === tab.key}
              onClick={() => setWorkspaceTab(tab.key)}
              className={`relative shrink-0 whitespace-nowrap px-4 pb-3 pt-1.5 text-sm font-medium transition-colors ${
                workspaceTab === tab.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {tab.label}
              {workspaceTab === tab.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="mt-6">
          {/* ============================================================ */}
          {/*  TAB 1 — My Status                                          */}
          {/* ============================================================ */}
          {workspaceTab === 'status' && (
            <div className="space-y-6">
              {statsLoading ? (
                <>
                  {/* Loading skeleton */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="mb-2 h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="mx-auto h-64 w-64 rounded-full" />
                    </CardContent>
                  </Card>
                </>
              ) : stats ? (
                <>
                  {/* Metric cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <BarChart3 className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.workspace.questionsAnswered}
                          </p>
                          <p className="text-2xl font-bold">
                            {stats.totalQuestions}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <Target className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.workspace.coveragePercent}
                          </p>
                          <p className="text-2xl font-bold">
                            {stats.coveragePercent}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                          <AlertTriangle className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t.workspace.weakConcepts}
                          </p>
                          <p className="text-2xl font-bold">
                            {stats.weakConceptsCount}{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                              {t.workspace.remaining}
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Radar chart */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">
                        {t.workspace.overallMastery}
                      </h3>
                      {stats.conceptMastery.length >= 3 ? (
                        <RadarChart data={stats.conceptMastery} />
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          {t.workspace.noConcepts}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Weekly activity bar chart */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">
                        {t.workspace.recentActivity}
                      </h3>
                      <div className="flex items-end justify-between gap-2 sm:gap-4">
                        {stats.recentActivity.map((day) => {
                          const maxCount = Math.max(
                            ...stats.recentActivity.map((d) => d.count),
                            1,
                          );
                          const heightPct = (day.count / maxCount) * 100;
                          return (
                            <div
                              key={day.date}
                              className="flex flex-1 flex-col items-center gap-1.5"
                            >
                              <span className="text-xs font-medium text-muted-foreground">
                                {day.count}
                              </span>
                              <div className="w-full max-w-[40px] rounded-t-md bg-emerald-100">
                                <div
                                  className="w-full rounded-t-md bg-emerald-500 transition-all"
                                  style={{ height: `${Math.max(heightPct, 4)}px` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {day.date}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t.common.noData}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/*  TAB 2 — Start Practice / Exam                              */}
          {/* ============================================================ */}
          {workspaceTab === 'practice' && (
            <Card>
              <CardContent className="space-y-6 p-6">
                {/* Review banner */}
                {isReviewAvailable && (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    <Zap className="size-4" />
                    <AlertDescription className="text-sm">
                      {t.workspace.reviewModeDescription}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Mode selection */}
                <div>
                  <Label className="mb-3 text-sm font-medium">
                    {t.workspace.mode}
                  </Label>
                  <RadioGroup
                    value={practiceMode}
                    onValueChange={(v) =>
                      setPracticeMode(v as 'practice' | 'exam')
                    }
                    className="grid grid-cols-2 gap-3 sm:grid-cols-2"
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                        practiceMode === 'practice'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="practice" className="sr-only" />
                      <BookOpen
                        className={`size-5 ${practiceMode === 'practice' ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${practiceMode === 'practice' ? 'text-emerald-700 dark:text-emerald-300' : ''}`}
                        >
                          {t.workspace.practice}
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                        practiceMode === 'exam'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="exam" className="sr-only" />
                      <BarChart3
                        className={`size-5 ${practiceMode === 'exam' ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${practiceMode === 'exam' ? 'text-emerald-700 dark:text-emerald-300' : ''}`}
                        >
                          {t.workspace.exam}
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Difficulty selection */}
                <div>
                  <Label className="mb-3 text-sm font-medium">
                    {t.workspace.difficulty}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['easy', t.workspace.easy],
                        ['medium', t.workspace.medium],
                        ['hard', t.workspace.hard],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPracticeDifficulty(key)}
                        className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                          practiceDifficulty === key
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-border text-foreground hover:border-muted-foreground/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope selection */}
                <div>
                  <Label className="mb-3 text-sm font-medium">
                    {t.workspace.scope}
                  </Label>
                  <RadioGroup
                    value={practiceScope}
                    onValueChange={(v) =>
                      setPracticeScope(v as 'entire' | 'file' | 'concept')
                    }
                    className="space-y-2"
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                        practiceScope === 'entire'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="entire" className="sr-only" />
                      <FolderOpen
                        className={`size-4 ${practiceScope === 'entire' ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-sm ${practiceScope === 'entire' ? 'font-medium text-emerald-700 dark:text-emerald-300' : ''}`}
                      >
                        {t.workspace.entireWorkspace}
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                        practiceScope === 'file'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="file" className="sr-only" />
                      <FileText
                        className={`size-4 ${practiceScope === 'file' ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-sm ${practiceScope === 'file' ? 'font-medium text-emerald-700 dark:text-emerald-300' : ''}`}
                      >
                        {t.workspace.specificFile}
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                        practiceScope === 'concept'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <RadioGroupItem value="concept" className="sr-only" />
                      <TreePine
                        className={`size-4 ${practiceScope === 'concept' ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-sm ${practiceScope === 'concept' ? 'font-medium text-emerald-700 dark:text-emerald-300' : ''}`}
                      >
                        {t.workspace.specificConcept}
                      </span>
                    </label>
                  </RadioGroup>

                  {/* File dropdown */}
                  {practiceScope === 'file' && (
                    <div className="mt-3">
                      <Select
                        value={selectedFileId}
                        onValueChange={setSelectedFileId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t.workspace.selectFile} />
                        </SelectTrigger>
                        <SelectContent>
                          {documents
                            ?.filter((d) => d.status === 'ready')
                            .map((doc) => (
                              <SelectItem key={doc.id} value={doc.id}>
                                {doc.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Concept dropdown */}
                  {practiceScope === 'concept' && (
                    <div className="mt-3">
                      <Select
                        value={selectedConcept}
                        onValueChange={setSelectedConcept}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t.workspace.selectConcept}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {conceptTree?.map((c) => (
                            <SelectItem key={c.name} value={c.name}>
                              {c.name} ({c.mastery}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {isReviewAvailable && practiceMode === 'practice'
                    ? t.workspace.reviewModeDescription
                    : practiceMode === 'practice'
                      ? t.workspace.practiceModeDescription
                      : t.workspace.examModeDescription}
                </p>

                {/* Start button */}
                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  size="lg"
                  disabled={
                    startSessionMutation.isPending ||
                    (practiceScope === 'file' && !selectedFileId) ||
                    (practiceScope === 'concept' && !selectedConcept)
                  }
                  onClick={() => startSessionMutation.mutate()}
                >
                  {startSessionMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    startLabel
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ============================================================ */}
          {/*  TAB 3 — Knowledge Tree                                     */}
          {/* ============================================================ */}
          {workspaceTab === 'tree' && (
            <div className="space-y-4">
              {treeLoading ? (
                <Card>
                  <CardContent className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : !conceptTree || conceptTree.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t.workspace.noConcepts}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    {/* Tree root */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg" role="img" aria-label="workspace">
                        {currentWorkspace?.icon ?? '📚'}
                      </span>
                      <span className="text-sm font-semibold">
                        {currentWorkspace?.name ?? workspaceId}
                      </span>
                    </div>

                    <Separator className="my-2" />

                    {/* Concept list */}
                    <div className="space-y-1" role="tree">
                      {conceptTree.map((concept, idx) => {
                        const isLast = idx === conceptTree.length - 1;
                        const isExpanded = expandedConcept === concept.name;

                        return (
                          <div key={concept.name} role="treeitem" aria-selected={expandedConcept === concept.name}>
                            {/* Concept row */}
                            <div className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                              {/* Tree connector */}
                              <span
                                className="select-none text-xs text-muted-foreground/50"
                                aria-hidden="true"
                              >
                                {isLast ? '└──' : '├──'}
                              </span>

                              {/* Expand/collapse chevron */}
                              <button
                                onClick={() =>
                                  setExpandedConcept(
                                    isExpanded ? null : concept.name,
                                  )
                                }
                                className="flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted"
                                aria-label={
                                  isExpanded ? 'Collapse' : 'Expand'
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="size-3.5 text-muted-foreground" />
                                )}
                              </button>

                              {/* Concept name */}
                              <button
                                onClick={() =>
                                  setExpandedConcept(
                                    isExpanded ? null : concept.name,
                                  )
                                }
                                className="min-w-0 flex-1 text-left text-sm font-medium text-foreground truncate"
                              >
                                {concept.name}
                              </button>

                              {/* Stats text */}
                              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                {concept.totalQuestions} {t.common.questions}
                              </span>

                              {/* Mastery mini-bar */}
                              <div className="hidden w-16 shrink-0 sm:block">
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${getMasteryBarColor(concept.mastery)}`}
                                    style={{
                                      width: `${Math.max(concept.mastery, 2)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Mastery percentage badge */}
                              <Badge
                                variant="outline"
                                className={`shrink-0 text-[10px] ${getMasteryTextColor(concept.mastery)}`}
                              >
                                {concept.mastery}%
                              </Badge>

                              {/* Filter button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 gap-1 text-xs text-muted-foreground hover:text-emerald-600"
                                onClick={() =>
                                  handleFilterByConcept(concept.name)
                                }
                              >
                                <Filter className="size-3" />
                                <span className="hidden sm:inline">
                                  {t.workspace.filterByConcept}
                                </span>
                              </Button>
                            </div>

                            {/* Expandable history */}
                            {isExpanded && (
                              <ConceptHistorySection
                                conceptName={concept.name}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/*  TAB 4 — My Resources                                       */}
          {/* ============================================================ */}
          {workspaceTab === 'resources' && (
            <div className="space-y-6">
              {/* Upload zone */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-sm font-semibold">
                    {t.workspace.uploadDocument}
                  </h3>

                  {!selectedFile ? (
                    <div
                      {...getRootProps()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                        isDragActive
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/30'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload
                        className={`mb-3 size-8 ${isDragActive ? 'text-emerald-500' : 'text-muted-foreground/50'}`}
                      />
                      <p className="mb-1 text-sm font-medium text-foreground">
                        {t.workspace.dragDrop}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.workspace.browseFiles}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        {t.workspace.supportedFormats}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selected file info */}
                      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                        <FileText className="size-8 shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setAiTags([]);
                          }}
                          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Remove file"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      {/* Dual-source tags */}
                      <div>
                        <p className="mb-2 text-xs text-muted-foreground">
                          {t.workspace.optionalTags}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Workspace tags */}
                          {workspaceTags?.map((wt) => (
                            <Badge
                              key={wt.tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {wt.tag}
                            </Badge>
                          ))}

                          {/* Divider + AI tags */}
                          {workspaceTags &&
                            workspaceTags.length > 0 &&
                            dedupedAiTags.length > 0 && (
                              <Separator
                                orientation="vertical"
                                className="mx-1 h-4"
                              />
                            )}

                          {/* AI suggested tags (non-deduplicated) */}
                          {suggestTagsMutation.isPending && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Sparkles className="size-3 animate-pulse text-amber-500" />
                              <span>...</span>
                            </div>
                          )}

                          {dedupedAiTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-amber-300 text-xs text-amber-700 dark:border-amber-700 dark:text-amber-400"
                            >
                              <Sparkles className="size-3" />
                              {tag}
                            </Badge>
                          ))}

                          {/* Show ✨ prefix for AI tags that overlap with workspace tags */}
                          {aiTags
                            .filter((tag) =>
                              workspaceTags?.some((wt) => wt.tag === tag),
                            )
                            .map((tag) => (
                              <Badge
                                key={`ai-${tag}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                <Sparkles className="size-3 text-amber-500" />
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      {/* Upload button */}
                      <Button
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={uploadMutation.isPending}
                        onClick={() => uploadMutation.mutate(selectedFile)}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {t.aiProcessing.uploading}
                          </>
                        ) : (
                          <>
                            <Upload className="size-4" />
                            {t.workspace.uploadDocument}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document list */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  {t.dashboard.documents}
                </h3>

                {docsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="size-10 shrink-0 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !documents || documents.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                      <FolderOpen className="mb-3 size-10 opacity-40" />
                      <p className="text-sm">{t.workspace.noDocuments}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="max-h-[480px] space-y-3 overflow-y-auto">
                    {documents.map((doc: DocumentWithWorkspace) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                                doc.status === 'ready'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-amber-100 text-amber-600'
                              }`}
                            >
                              <FileText className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium">
                                  {doc.title}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`shrink-0 text-[10px] ${
                                    doc.status === 'ready'
                                      ? 'border-emerald-300 text-emerald-600'
                                      : 'border-amber-300 text-amber-600'
                                  }`}
                                >
                                  {doc.status === 'ready'
                                    ? t.workspace.ready
                                    : t.workspace.processing}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {doc.filename} &middot;{' '}
                                {formatFileSize(doc.file_size)} &middot;{' '}
                                {timeAgo(doc.uploaded_at)}
                              </p>

                              {/* Coverage bar */}
                              <div className="mt-2">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {t.workspace.fileCoverage}
                                  </span>
                                  <span className="text-xs font-medium">
                                    {doc.coverage}%
                                  </span>
                                </div>
                                <Progress
                                  value={doc.coverage}
                                  className="h-1.5"
                                />
                              </div>

                              {/* Tags */}
                              {doc.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {doc.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Practice button */}
                              {doc.status === 'ready' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                  onClick={() =>
                                    handlePracticeFromFile(doc.id)
                                  }
                                >
                                  <BookOpen className="size-3.5" />
                                  {t.workspace.practiceFromFile}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}