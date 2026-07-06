import { useQuery } from '@tanstack/react-query';
import { getDashboardStatsApi, getRecentActivityApi, getWeakConceptsApi, getWeeklyActivityApi, getSubjectDistributionApi } from '@/features/dashboard/api';
import { getDocumentsApi } from '@/features/documents/api';

export function useDashboardData() {
  const stats = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStatsApi });
  const activity = useQuery({ queryKey: ['recent-activity'], queryFn: getRecentActivityApi });
  const weakConcepts = useQuery({ queryKey: ['weak-concepts'], queryFn: getWeakConceptsApi });
  const documents = useQuery({ queryKey: ['documents'], queryFn: getDocumentsApi });
  const weeklyActivity = useQuery({ queryKey: ['weekly-activity'], queryFn: getWeeklyActivityApi });
  const subjectDistribution = useQuery({ queryKey: ['subject-distribution'], queryFn: getSubjectDistributionApi });

  return { stats, activity, weakConcepts, documents, weeklyActivity, subjectDistribution };
}