'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
  title: string;
  legendLess: string;
  legendMore: string;
  tooltipLabel: (date: string, count: number) => string;
}

const INTENSITY_LEVELS = 5;

function getIntensity(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 1;
  const level = Math.ceil((count / maxCount) * INTENSITY_LEVELS);
  return Math.min(level, INTENSITY_LEVELS);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function ActivityHeatmap({
  data,
  title,
  legendLess,
  legendMore,
  tooltipLabel,
}: ActivityHeatmapProps) {
  const { grid, maxCount } = useMemo(() => {
    const activityMap = new Map<string, number>();
    data.forEach((d) => activityMap.set(d.date, d.count));

    const maxCount = Math.max(...data.map((d) => d.count), 1);

    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) ?? 0;
      days.push({
        date: dateStr,
        count,
        dayOfWeek: date.getDay(),
      });
    }

    const weeks: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    if (days.length > 0 && days[0].dayOfWeek !== 0) {
      for (let i = 0; i < days[0].dayOfWeek; i++) {
        currentWeek.push({ date: '', count: -1 });
      }
    }

    days.forEach((day) => {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date: day.date, count: day.count });
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { grid: weeks, maxCount };
  }, [data]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-1">
            <TooltipProvider>
              {grid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => {
                    if (day.count < 0) {
                      return (
                        <div
                          key={`${weekIdx}-${dayIdx}`}
                          className="size-3 rounded-sm"
                        />
                      );
                    }

                    const intensity = getIntensity(day.count, maxCount);
                    const bgClass = intensity === 0
                      ? 'bg-muted/30'
                      : intensity === 1
                        ? 'bg-primary/20'
                        : intensity === 2
                          ? 'bg-primary/40'
                          : intensity === 3
                            ? 'bg-primary/60'
                            : intensity === 4
                              ? 'bg-primary/80'
                              : 'bg-primary';

                    return (
                      <Tooltip key={`${weekIdx}-${dayIdx}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`size-3 rounded-sm transition-colors ${bgClass}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{formatDate(day.date)}</p>
                          <p className="text-muted-foreground">
                            {tooltipLabel(day.date, day.count)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{legendLess}</span>
          <div className="flex gap-0.5">
            <div className="size-3 rounded-sm bg-muted/30" />
            <div className="size-3 rounded-sm bg-primary/20" />
            <div className="size-3 rounded-sm bg-primary/40" />
            <div className="size-3 rounded-sm bg-primary/60" />
            <div className="size-3 rounded-sm bg-primary/80" />
            <div className="size-3 rounded-sm bg-primary" />
          </div>
          <span>{legendMore}</span>
        </div>
      </CardContent>
    </Card>
  );
}
