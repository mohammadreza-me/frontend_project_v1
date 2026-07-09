'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';
import { cn } from '@/lib/utils';

export interface ProcessingStep {
  key: string;
  i18nKey: string; // key in t.aiProcessing, e.g. 'uploading'
  estimatedSeconds?: number;
}

interface AIProcessingIndicatorProps {
  steps: ProcessingStep[];
  currentStepIndex: number;
  className?: string;
}

export function AIProcessingIndicator({ steps, currentStepIndex, className }: AIProcessingIndicatorProps) {
  const t = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStep = steps[currentStepIndex];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6 py-12', className)}>
      {/* Animated spinner */}
      <div className="relative size-16">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-900" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🧠</span>
        </div>
      </div>

      {/* Steps list */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-300',
                isCompleted && 'opacity-50',
                isActive && 'bg-emerald-50 dark:bg-emerald-950/30',
                isPending && 'opacity-30',
              )}
            >
              {/* Status icon */}
              <div className="flex size-6 shrink-0 items-center justify-center">
                {isCompleted ? (
                  <Check className="size-4 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="size-4 animate-spin text-emerald-500" />
                ) : (
                  <div className="size-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              {/* Step text */}
              <span
                className={cn(
                  'flex-1',
                  isActive && 'font-medium text-foreground',
                  isCompleted && 'text-muted-foreground line-through',
                  isPending && 'text-muted-foreground',
                )}
              >
                {t.aiProcessing[step.i18nKey as keyof typeof t.aiProcessing]}
              </span>

              {/* Estimated time for active step */}
              {isActive && step.estimatedSeconds && (
                <span className="text-xs text-muted-foreground">
                  ~{step.estimatedSeconds}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}

/** Preset step lists for common operations */
export const QUESTION_GENERATION_STEPS: ProcessingStep[] = [
  { key: 'analyzing', i18nKey: 'analyzingDocument', estimatedSeconds: 3 },
  { key: 'designing', i18nKey: 'designingQuestions', estimatedSeconds: 4 },
  { key: 'preparing', i18nKey: 'preparingOptions', estimatedSeconds: 2 },
];

export const FILE_UPLOAD_STEPS: ProcessingStep[] = [
  { key: 'uploading', i18nKey: 'uploading', estimatedSeconds: 2 },
  { key: 'extracting', i18nKey: 'extractingText', estimatedSeconds: 3 },
  { key: 'analyzing', i18nKey: 'analyzingTopics', estimatedSeconds: 4 },
];