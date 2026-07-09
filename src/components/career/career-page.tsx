'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUIStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getCareerOptionsApi, simulateCareerPathApi } from '@/features/career/api';
import { getWeakConceptsApi } from '@/features/dashboard/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Target, Clock, BookOpen, ArrowLeft } from 'lucide-react';
import type { CareerOption, CareerSimulationResponse } from '@/types';

const loadingMessages = [
  'career.analyzeWeak',
  'career.designPath',
];

export function CareerPage() {
  const t = useTranslation();
  const navigate = useUIStore((s) => s.navigate);
  const [selectedCareer, setSelectedCareer] = useState<CareerOption | null>(null);
  const [open, setOpen] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [result, setResult] = useState<CareerSimulationResponse | null>(null);

  const { data: careers = [], isLoading: careersLoading } = useQuery({
    queryKey: ['career-options'],
    queryFn: getCareerOptionsApi,
  });

  const { data: weakConcepts = [] } = useQuery({
    queryKey: ['weak-concepts-career'],
    queryFn: getWeakConceptsApi,
  });

  const simulationMutation = useMutation({
    mutationFn: simulateCareerPathApi,
    onSuccess: (data) => {
      setResult(data);
      setLoadingMsgIndex(-1);
    },
  });

  // Rotate loading messages
  const isSimulating = simulationMutation.isPending;
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleSubmit = () => {
    if (!selectedCareer) return;
    setResult(null);
    setLoadingMsgIndex(0);
    simulationMutation.mutate({ career_id: selectedCareer.id });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 text-muted-foreground"
          onClick={() => navigate('dashboard')}
        >
          <ArrowLeft className="size-4 me-1" />
          {t.common.back}
        </Button>
        <h1 className="text-2xl font-bold">{t.career.title}</h1>
      </div>

      {/* Career Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.career.selectCareer}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedCareer
                  ? selectedCareer.title
                  : t.career.careerPlaceholder}
                <ChevronsUpDown className="ms-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder={t.career.careerPlaceholder} />
                <CommandList className="max-h-64">
                  <CommandEmpty>{t.career.noResults}</CommandEmpty>
                  <CommandGroup>
                    {careers.map((career) => (
                      <CommandItem
                        key={career.id}
                        value={career.title}
                        onSelect={() => {
                          setSelectedCareer(career);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={`me-2 size-4 ${
                            selectedCareer?.id === career.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{career.title}</p>
                          <p className="text-xs text-muted-foreground">{career.description}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedCareer && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
              disabled={simulationMutation.isPending}
            >
              <Target className="size-4 me-2" />
              {t.common.submit}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Weak Areas Summary */}
      {weakConcepts.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.career.weakAreas}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weakConcepts.slice(0, 5).map((concept) => (
                <Badge
                  key={concept.id}
                  variant="outline"
                  className={
                    concept.mastery < 40
                      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                      : 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
                  }
                >
                  {concept.name} ({concept.mastery}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {simulationMutation.isPending && (
        <Card>
          <CardContent className="py-8 text-center">
            <Skeleton className="mx-auto mb-4 h-4 w-64" />
            <p className="text-sm text-muted-foreground">
              {t.career[loadingMessages[loadingMsgIndex] as keyof typeof t.career] as string}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {simulationMutation.isError && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-destructive mb-3">{t.common.error}</p>
            <Button variant="outline" onClick={handleSubmit}>
              {t.common.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results: Timeline */}
      {result && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{t.career.learningPath}</h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute start-4 top-0 bottom-0 w-0.5 bg-emerald-200 dark:bg-emerald-800 md:start-6" />

            {result.stages.map((stage, index) => (
              <div key={stage.order} className="relative mb-8 ps-10 md:ps-14">
                {/* Circle on timeline */}
                <div className="absolute start-2.5 top-1 flex size-3 items-center justify-center rounded-full border-2 border-emerald-500 bg-background md:start-4.5 md:size-4">
                  <div className="size-1.5 rounded-full bg-emerald-500 md:size-2" />
                </div>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {t.career.stage} {stage.order}: {stage.title}
                      </CardTitle>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="size-3" />
                        {stage.estimated_weeks} {t.career.estimatedWeeks}
                      </Badge>
                    </div>
                    <CardDescription>{stage.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <BookOpen className="size-3.5" />
                        {t.career.relatedConcepts}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.concept_names.map((name, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => navigate('practice')}
                    >
                      {t.career.startPractice}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {!result && !simulationMutation.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.career.suggestions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {careers.slice(0, 4).map((career) => (
                <button
                  key={career.id}
                  onClick={() => setSelectedCareer(career)}
                  className={`rounded-lg border p-3 text-start transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20 ${
                    selectedCareer?.id === career.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : ''
                  }`}
                >
                  <p className="text-sm font-medium">{career.title}</p>
                  <p className="text-xs text-muted-foreground">{career.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}