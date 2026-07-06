'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUIStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { isRtl } from '@/lib/i18n';
import { getDocumentsApi } from '@/features/documents/api';
import {
  generateQuestionsApi,
  submitAnswerApi,
  completeExamApi,
} from '@/features/questions/api';
import type {
  PracticeSession,
  ExamResult,
  SubmittedAnswer,
  SubmitAnswerResponse,
} from '@/types';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Loader2,
  BookOpen,
  BarChart3,
} from 'lucide-react';

type Phase = 'select' | 'generating' | 'answering' | 'results';

export default function QuestionPage() {
  const currentPage = useUIStore((s) => s.currentPage);
  const locale = useUIStore((s) => s.locale);
  const navigate = useUIStore((s) => s.navigate);
  const rtl = isRtl(locale);
  const t = useTranslation();

  const isExam = currentPage === 'exam';

  // ─── State ───────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<SubmittedAnswer[]>([]);
  const [answerFeedback, setAnswerFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [submittedForQuestion, setSubmittedForQuestion] = useState<Set<string>>(new Set());
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const generatingStartRef = useRef<number>(0);

  // ─── Queries & Mutations ─────────────────────────────────
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocumentsApi,
  });

  const readyDocuments = documents.filter((d) => d.status === 'ready');

  const generateMutation = useMutation({
    mutationFn: (docId: string) =>
      generateQuestionsApi(docId, undefined, 5, isExam ? 'exam' : 'practice'),
    onSuccess: (data) => {
      setSession(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setSubmittedAnswers([]);
      setAnswerFeedback(null);
      setSubmittedForQuestion(new Set());
      setPhase('answering');
      if (data.time_limit_seconds) {
        setTimeRemaining(data.time_limit_seconds);
      }
      setShowRetry(false);
    },
    onError: () => {
      setShowRetry(true);
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitAnswerApi,
    onSuccess: (data) => {
      setAnswerFeedback(data);
      const question = session?.questions[currentQuestionIndex];
      if (question) {
        setSubmittedForQuestion((prev) => new Set([...prev, question.id]));
        setSubmittedAnswers((prev) => [
          ...prev,
          {
            question_id: question.id,
            selected_option_id: selectedAnswer!,
            correct: data.correct,
          },
        ]);
      }
    },
  });

  const completeExamMutation = useMutation({
    mutationFn: completeExamApi,
    onSuccess: (data) => {
      setExamResult(data);
      setPhase('results');
    },
  });

  // ─── Concept Performance (for practice results) ─────────
  const conceptPerformance = useMemo(() => {
    if (!session) return [];
    const map = new Map<string, { correct: number; total: number }>();
    for (const q of session.questions) {
      const answer = submittedAnswers.find((a) => a.question_id === q.id);
      const entry = map.get(q.concept_name) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (answer?.correct) entry.correct += 1;
      map.set(q.concept_name, entry);
    }
    return Array.from(map.entries()).map(([name, { correct, total }]) => ({
      name,
      correct,
      total,
      rate: total > 0 ? Math.round((correct / total) * 100) : 0,
    }));
  }, [session, submittedAnswers]);

  // ─── Rotating loading messages ───────────────────────────
  const loadingMessages = [
    t.practice.analyzing,
    t.practice.designingQuestion,
    t.practice.preparingChoices,
    t.practice.generatingQuestions,
  ];

  useEffect(() => {
    if (phase !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phase, loadingMessages.length]);

  // ─── Retry after 25 seconds ──────────────────────────────
  useEffect(() => {
    if (phase !== 'generating') return;
    generatingStartRef.current = Date.now();
    const timeout = setTimeout(() => {
      setShowRetry(true);
    }, 25000);
    return () => clearTimeout(timeout);
  }, [phase]);

  // ─── Exam timer ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'answering' || !isExam || !session?.time_limit_seconds) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAutoSubmitted(true);
              if (session) {
                completeExamMutation.mutate(session.id);
              }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isExam, session?.time_limit_seconds]);

  // ─── Handlers ────────────────────────────────────────────
  const handleStart = () => {
    if (!selectedDocId) return;
    setPhase('generating');
    setLoadingMessageIndex(0);
    setShowRetry(false);
    setAutoSubmitted(false);
    generateMutation.mutate(selectedDocId);
  };

  const handleSelectAnswer = (optionId: string) => {
    if (isExam) {
      // Exam mode: select and move to next
      const question = session?.questions[currentQuestionIndex];
      if (!question) return;
      setSelectedAnswer(optionId);
      setSubmittedAnswers((prev) => {
        const filtered = prev.filter((a) => a.question_id !== question.id);
        return [...filtered, { question_id: question.id, selected_option_id: optionId, correct: false }];
      });
      // Auto-advance after a brief delay
      setTimeout(() => {
        if (currentQuestionIndex < (session?.questions.length ?? 0) - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedAnswer(null);
        }
      }, 300);
    } else {
      // Practice mode: submit immediately
      const question = session?.questions[currentQuestionIndex];
      if (!question || submittedForQuestion.has(question.id)) return;
      setSelectedAnswer(optionId);
      submitMutation.mutate({
        session_id: session!.id,
        question_id: question.id,
        selected_option_id: optionId,
      });
    }
  };

  const handleNext = () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    } else {
      setPhase('results');
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      // Restore state for already-answered questions in practice mode
      const prevQ = session?.questions[currentQuestionIndex - 1];
      if (prevQ && !isExam) {
        const prevAnswer = submittedAnswers.find((a) => a.question_id === prevQ.id);
        if (prevAnswer) {
          setSelectedAnswer(prevAnswer.selected_option_id);
          setAnswerFeedback({
            correct: prevAnswer.correct,
            correct_option_id: prevQ.correct_option_id,
            explanation: prevQ.explanation,
            concept_id: prevQ.concept_id,
            concept_name: prevQ.concept_name,
          });
        } else {
          setSelectedAnswer(null);
          setAnswerFeedback(null);
        }
      } else if (prevQ && isExam) {
        const prevAnswer = submittedAnswers.find((a) => a.question_id === prevQ.id);
        setSelectedAnswer(prevAnswer?.selected_option_id ?? null);
      }
    }
  };

  const handleExamSubmit = () => {
    if (!session) return;
    completeExamMutation.mutate(session.id);
  };

  const handleNewSession = () => {
    setPhase('select');
    setSession(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setSubmittedAnswers([]);
    setAnswerFeedback(null);
    setSubmittedForQuestion(new Set());
    setExamResult(null);
    setReviewMode(false);
    setAutoSubmitted(false);
    setTimeRemaining(0);
  };

  const handleViewSkillGraph = (conceptId: string) => {
    navigate('skill-graph', { conceptId });
  };

  // ─── Helpers ─────────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const allAnswered =
    session &&
    session.questions.every((q) =>
      submittedAnswers.some((a) => a.question_id === q.id)
    );

  // ─── Render: Document Selection (Phase 1) ────────────────
  if (phase === 'select') {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className={isExam ? 'border-2 border-muted' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              {isExam ? (
                <BarChart3 className="size-6 text-amber-500" />
              ) : (
                <BookOpen className="size-6 text-emerald-500" />
              )}
              {isExam ? t.exam.title : t.practice.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {t.practice.selectDocument}
            </CardDescription>
            {isExam && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {t.exam.formalNotice}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readyDocuments.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  {t.practice.noQuestions}
                </p>
              ) : (
                readyDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full rounded-lg border p-4 text-start transition-all hover:bg-accent ${
                      selectedDocId === doc.id
                        ? isExam
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium">{doc.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {doc.concept_count} concepts · {doc.question_count} questions
                        </p>
                      </div>
                      {selectedDocId === doc.id && (
                        <CheckCircle2
                          className={`size-5 shrink-0 ${
                            isExam ? 'text-amber-500' : 'text-emerald-500'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              size="lg"
              disabled={!selectedDocId}
              onClick={handleStart}
              className={
                isExam
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }
            >
              {isExam ? t.exam.startExam : t.practice.startPractice}
              {rtl ? (
                <ArrowLeft className="ms-2 size-4" />
              ) : (
                <ArrowRight className="me-2 size-4" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  // ─── Render: Generating Questions (Phase 2) ──────────────
  if (phase === 'generating') {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Skeleton matching the final question card layout */}
        <Card className={isExam ? 'border-2 border-muted' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4"
                >
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </CardFooter>
        </Card>

        {/* Overlay loading indicator */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-emerald-500" />
            <p className="text-sm font-medium text-muted-foreground transition-all duration-300">
              {loadingMessages[loadingMessageIndex]}
            </p>
          </div>
          <Progress value={((loadingMessageIndex + 1) / loadingMessages.length) * 100} className="w-64" />
          {showRetry && (
            <Button variant="outline" onClick={handleStart} className="mt-2">
              <RotateCcw className="me-2 size-4" />
              {t.common.retry}
            </Button>
          )}
        </div>
      </main>
    );
  }

  // ─── Render: Answering Questions (Phase 3) ───────────────
  if (phase === 'answering' && session) {
    const question = session.questions[currentQuestionIndex];
    if (!question) return null;

    const isQuestionSubmitted = submittedForQuestion.has(question.id);
    const currentExamAnswer = isExam
      ? submittedAnswers.find((a) => a.question_id === question.id)
      : null;

    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Exam timer */}
        {isExam && session.time_limit_seconds && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-muted bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>{t.exam.timeRemaining}</span>
            </div>
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                timeRemaining < 60
                  ? 'animate-pulse text-red-500'
                  : timeRemaining < 180
                    ? 'text-amber-500'
                    : 'text-foreground'
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}

        {/* Exam question navigation strip */}
        {isExam && (
          <div className="mb-4 flex flex-wrap gap-2">
            {session.questions.map((q, idx) => {
              const isAnswered = submittedAnswers.some((a) => a.question_id === q.id);
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    const ans = submittedAnswers.find((a) => a.question_id === q.id);
                    setSelectedAnswer(ans?.selected_option_id ?? null);
                  }}
                  className={`flex size-9 items-center justify-center rounded-md text-sm font-medium transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isAnswered
                        ? 'bg-muted text-muted-foreground'
                        : 'border border-border bg-background text-foreground hover:bg-accent'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Question Card */}
        <Card className={isExam ? 'border-2 border-muted' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant={isExam ? 'outline' : 'secondary'}>
                {t.practice.questionOf
                  .replace('{current}', String(currentQuestionIndex + 1))
                  .replace('{total}', String(session.questions.length))}
              </Badge>
              <Badge
                variant="outline"
                className={
                  question.difficulty === 'easy'
                    ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                    : question.difficulty === 'hard'
                      ? 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400'
                      : 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                }
              >
                {question.difficulty}
              </Badge>
            </div>
            <CardTitle className="mt-4 text-lg leading-relaxed">
              {question.text}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Practice: Progress bar */}
            {!isExam && (
              <Progress
                value={
                  ((currentQuestionIndex + (isQuestionSubmitted ? 1 : 0)) /
                    session.questions.length) *
                  100
                }
                className="mb-6"
              />
            )}

            {/* Answer options */}
            <div className="space-y-3">
              {question.options.map((option) => {
                const isSelected = (isExam
                  ? currentExamAnswer?.selected_option_id
                  : selectedAnswer) === option.id;
                const isCorrect = option.id === question.correct_option_id;
                const showResult = !isExam && isQuestionSubmitted;

                let optionClass =
                  'cursor-pointer rounded-lg border-2 p-4 text-start transition-all hover:bg-accent';

                if (showResult) {
                  if (isSelected && isCorrect) {
                    optionClass =
                      'rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4 text-start dark:bg-emerald-950/30';
                  } else if (isSelected && !isCorrect) {
                    optionClass =
                      'rounded-lg border-2 border-red-500 bg-red-50 p-4 text-start dark:bg-red-950/30';
                  } else if (!isSelected && isCorrect) {
                    optionClass =
                      'rounded-lg border-2 border-emerald-500 bg-emerald-50/50 p-4 text-start dark:bg-emerald-950/20';
                  } else {
                    optionClass =
                      'rounded-lg border-2 border-border p-4 text-start opacity-60';
                  }
                } else if (isExam && isSelected) {
                  optionClass =
                    'rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-start dark:bg-amber-950/30';
                } else if (!isExam && !isQuestionSubmitted) {
                  optionClass =
                    'cursor-pointer rounded-lg border-2 border-border p-4 text-start transition-all hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20';
                } else {
                  optionClass =
                    'rounded-lg border-2 border-border p-4 text-start';
                }

                return (
                  <div key={option.id}>
                    <button
                      className={optionClass}
                      onClick={() => handleSelectAnswer(option.id)}
                      disabled={isQuestionSubmitted || submitMutation.isPending}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                          {String.fromCharCode(65 + question.options.indexOf(option))}
                        </span>
                        <span className="flex-1 text-sm">{option.text}</span>
                        {showResult && isSelected && isCorrect && (
                          <CheckCircle2 className="ms-auto mt-0.5 size-5 shrink-0 text-emerald-500" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="ms-auto mt-0.5 size-5 shrink-0 text-red-500" />
                        )}
                        {showResult && !isSelected && isCorrect && (
                          <CheckCircle2 className="ms-auto mt-0.5 size-5 shrink-0 text-emerald-500" />
                        )}
                      </div>
                    </button>
                    {/* Practice: Accordion with option explanation after submission */}
                    {showResult && (
                      <Accordion type="single" collapsible className="mt-1">
                        <AccordionItem value={option.id} className="border-b-0">
                          <AccordionTrigger className="ps-4 py-2 text-xs text-muted-foreground hover:no-underline">
                            {t.practice.explanation}
                          </AccordionTrigger>
                          <AccordionContent className="ps-10 text-xs text-muted-foreground">
                            {option.explanation}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Practice: Feedback after answer */}
            {!isExam && isQuestionSubmitted && answerFeedback && (
              <div className="mt-6 space-y-3">
                <Separator />
                <div
                  className={`rounded-lg p-4 ${
                    answerFeedback.correct
                      ? 'bg-emerald-50 dark:bg-emerald-950/30'
                      : 'bg-red-50 dark:bg-red-950/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {answerFeedback.correct ? (
                      <>
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {t.practice.correct}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-5 text-red-500" />
                        <span className="font-medium text-red-700 dark:text-red-400">
                          {t.practice.incorrect}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {answerFeedback.explanation}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t.practice.relatedConcept}:
                    </span>
                    <button
                      onClick={() => handleViewSkillGraph(answerFeedback.concept_id)}
                      className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {answerFeedback.concept_name}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              {rtl ? (
                <ArrowRight className="me-2 size-4" />
              ) : (
                <ArrowLeft className="me-2 size-4" />
              )}
              {t.common.back}
            </Button>

            {isExam ? (
              <div className="flex gap-2">
                {currentQuestionIndex < session.questions.length - 1 ? (
                  <Button onClick={handleNext}>
                    {t.common.next}
                    {rtl ? (
                      <ArrowLeft className="ms-2 size-4" />
                    ) : (
                      <ArrowRight className="ms-2 size-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleExamSubmit}
                    disabled={completeExamMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {completeExamMutation.isPending && (
                      <Loader2 className="me-2 size-4 animate-spin" />
                    )}
                    {t.common.submit}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  !isQuestionSubmitted ||
                  currentQuestionIndex === session.questions.length - 1
                    ? !isQuestionSubmitted
                    : false
                }
              >
                {currentQuestionIndex === session.questions.length - 1
                  ? t.practice.sessionComplete
                  : t.common.next}
                {currentQuestionIndex < session.questions.length - 1 &&
                  (rtl ? (
                    <ArrowLeft className="ms-2 size-4" />
                  ) : (
                    <ArrowRight className="ms-2 size-4" />
                  ))}
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    );
  }

  // ─── Render: Results (Phase 4) ───────────────────────────
  if (phase === 'results') {
    const correctCount = isExam
      ? examResult?.correct_count ?? 0
      : submittedAnswers.filter((a) => a.correct).length;
    const totalQuestions = isExam
      ? examResult?.total_questions ?? 0
      : session?.questions.length ?? 0;
    const incorrectCount = totalQuestions - correctCount;
    const scorePercent = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    // Format time as "Xm Ys"
    const formatTimeLong = (seconds: number): string => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      if (m === 0) return `${s}${t.exam.seconds}`;
      return `${m}${t.exam.minutes} ${s}${t.exam.seconds}`;
    };

    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {autoSubmitted && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t.exam.autoSubmitWarning}
            </p>
          </div>
        )}

        {/* ═══ Practice Results ═══ */}
        {!isExam && (
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="text-xl">
                {t.practice.sessionComplete}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Donut Chart */}
              <div className="flex justify-center">
                <div className="relative size-40 sm:size-48">
                  <svg className="size-full -rotate-90" viewBox="0 0 192 192">
                    <circle
                      cx="96" cy="96" r="70" fill="none"
                      stroke="#ef4444" strokeWidth="20"
                      strokeDasharray={`${incorrectCount > 0 ? (incorrectCount / totalQuestions) * 2 * Math.PI * 70 : 0} ${2 * Math.PI * 70}`}
                      strokeDashoffset={`${-(correctCount / totalQuestions) * 2 * Math.PI * 70}`}
                    />
                    <circle
                      cx="96" cy="96" r="70" fill="none"
                      stroke="#10b981" strokeWidth="20"
                      strokeDasharray={`${(correctCount / totalQuestions) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                    />
                  </svg>
                  {/* Center text overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-3xl font-bold ${
                        scorePercent >= 70
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : scorePercent >= 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {scorePercent}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.dashboard.successRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score text below donut */}
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`flex size-10 items-center justify-center rounded-full ${
                    scorePercent >= 70
                      ? 'bg-emerald-100 dark:bg-emerald-950/40'
                      : scorePercent >= 40
                        ? 'bg-amber-100 dark:bg-amber-950/40'
                        : 'bg-red-100 dark:bg-red-950/40'
                  }`}
                >
                  <Trophy
                    className={`size-5 ${
                      scorePercent >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : scorePercent >= 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                </div>
                <p className="text-lg font-semibold">
                  {correctCount}/{totalQuestions} — {t.practice.score}
                </p>
              </div>

              {/* Concept Performance Summary */}
              {conceptPerformance.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="size-4 text-muted-foreground" />
                    {t.dashboard.conceptPerformance}
                  </h4>
                  <div className="space-y-2">
                    {conceptPerformance.map((cp) => {
                      const barColor =
                        cp.rate >= 70
                          ? 'bg-emerald-500'
                          : cp.rate >= 40
                            ? 'bg-amber-500'
                            : 'bg-red-500';
                      const textColor =
                        cp.rate >= 70
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : cp.rate >= 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400';
                      return (
                        <div key={cp.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate pe-2 font-medium">{cp.name}</span>
                            <span className={`shrink-0 text-xs font-semibold ${textColor}`}>
                              {cp.correct}/{cp.total}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${cp.rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReviewMode((prev) => !prev)}
                >
                  {t.practice.reviewAnswers}
                </Button>
                <Button
                  onClick={handleNewSession}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {t.practice.newSession}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ Exam Results ═══ */}
        {isExam && examResult && (
          <Card className="border-2 border-muted">
            <CardHeader className="items-center text-center">
              <CardTitle className="text-xl">
                {t.exam.examComplete}
              </CardTitle>
              <CardDescription className="mt-1">
                {t.exam.results}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Donut Chart with amber accent */}
              <div className="flex justify-center">
                <div className="relative size-40 sm:size-48">
                  <svg className="size-full -rotate-90" viewBox="0 0 192 192">
                    <circle
                      cx="96" cy="96" r="70" fill="none"
                      stroke="#ef4444" strokeWidth="20"
                      strokeDasharray={`${incorrectCount > 0 ? (incorrectCount / totalQuestions) * 2 * Math.PI * 70 : 0} ${2 * Math.PI * 70}`}
                      strokeDashoffset={`${-(correctCount / totalQuestions) * 2 * Math.PI * 70}`}
                    />
                    <circle
                      cx="96" cy="96" r="70" fill="none"
                      stroke="#d97706" strokeWidth="20"
                      strokeDasharray={`${(correctCount / totalQuestions) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                    />
                  </svg>
                  {/* Center text overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-3xl font-bold ${
                        scorePercent >= 70
                          ? 'text-amber-600 dark:text-amber-400'
                          : scorePercent >= 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {scorePercent}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.dashboard.successRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score and Time stats */}
              <div className="grid grid-cols-3 gap-4">
                {/* Score */}
                <div className="text-center">
                  <p className="text-2xl font-bold">{correctCount}/{totalQuestions}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.exam.score}
                  </p>
                </div>
                {/* Success Rate */}
                <div className="text-center">
                  <div
                    className={`flex size-10 mx-auto items-center justify-center rounded-full ${
                      scorePercent >= 70
                        ? 'bg-amber-100 dark:bg-amber-950/40'
                        : 'bg-red-100 dark:bg-red-950/40'
                    }`}
                  >
                    <Trophy
                      className={`size-5 ${
                        scorePercent >= 70
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.dashboard.successRate}
                  </p>
                </div>
                {/* Time Taken */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="size-5 text-amber-500" />
                    <p className="text-2xl font-bold">
                      {formatTime(examResult.time_taken_seconds)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.dashboard.timeSpent}
                  </p>
                </div>
              </div>

              {/* Time Taken prominent display */}
              <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t.exam.timeTaken}: {formatTimeLong(examResult.time_taken_seconds)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReviewMode((prev) => !prev)}
                >
                  {t.exam.reviewAnswers}
                </Button>
                <Button
                  onClick={() => navigate('dashboard')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {t.dashboard.backToDashboard}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review section */}
        {reviewMode && session && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {isExam ? t.exam.reviewAnswers : t.practice.reviewAnswers}
            </h3>
            {(isExam && examResult
              ? examResult.answers
              : session.questions.map((q, idx) => {
                  const answer = submittedAnswers.find((a) => a.question_id === q.id);
                  return {
                    question_id: q.id,
                    question_text: q.text,
                    selected_option_id: answer?.selected_option_id ?? '',
                    correct_option_id: q.correct_option_id,
                    correct: answer?.correct ?? false,
                    concept_name: q.concept_name,
                    explanation: q.explanation,
                  };
                })
            ).map((item, idx) => (
              <Card key={item.question_id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        item.correct
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium">{item.question_text}</p>
                      {!item.correct && item.selected_option_id && (
                        <div className="rounded-md border border-red-200 bg-red-50 ps-4 pe-3 py-2 dark:border-red-800 dark:bg-red-950/30">
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {t.practice.correctAnswer}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {session.questions
                              .find((q) => q.id === item.question_id)
                              ?.options.find((o) => o.id === item.correct_option_id)
                              ?.text}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {item.explanation}
                      </p>
                      <button
                        onClick={() => handleViewSkillGraph(
                          session.questions.find((q) => q.id === item.question_id)?.concept_id ?? ''
                        )}
                        className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        {t.practice.relatedConcept}: {item.concept_name}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    );
  }

  return null;
}