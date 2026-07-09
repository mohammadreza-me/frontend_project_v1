import type {
  DashboardStats,
  RecentActivity,
  WeakConcept as DashboardWeakConcept,
} from '@/types';

function delay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  await delay();
  return {
    total_answers: 347,
    total_generated_questions: 520,
    total_practice_time_minutes: 1245,
    success_rate: 72.5,
    daily_streak: 12,
    documents_count: 5,
    concepts_learned: 89,
    questions_today: 15,
  };
}

export async function getRecentActivityApi(): Promise<RecentActivity[]> {
  await delay();
  return [
    {
      id: 'act-1',
      question_text: 'در مدل OSI لایه مسئول مسیریابی بسته‌ها کدام است؟',
      concept_name: 'مدل OSI',
      correct: true,
      answered_at: '2024-03-12T16:30:00Z',
      mode: 'practice',
    },
    {
      id: 'act-2',
      question_text: 'کدام الگوریتم مرتب‌سازی بهترین حالت O(n log n) دارد؟',
      concept_name: 'مرتب‌سازی',
      correct: false,
      answered_at: '2024-03-12T16:25:00Z',
      mode: 'practice',
    },
    {
      id: 'act-3',
      question_text: 'تفاوت بین JOIN و LEFT JOIN چیست؟',
      concept_name: 'SQL Joins',
      correct: true,
      answered_at: '2024-03-12T15:50:00Z',
      mode: 'exam',
    },
    {
      id: 'act-4',
      question_text: 'درخت BST برای چه نوع عملیاتی مناسب است؟',
      concept_name: 'درخت جستجوی دودویی',
      correct: true,
      answered_at: '2024-03-12T15:20:00Z',
      mode: 'practice',
    },
    {
      id: 'act-5',
      question_text: 'نرخ یادگیری (learning rate) در شبکه‌های عصبی چه تأثیری دارد؟',
      concept_name: 'بهینه‌سازی',
      correct: false,
      answered_at: '2024-03-12T14:45:00Z',
      mode: 'practice',
    },
  ];
}

export async function getWeakConceptsApi(): Promise<DashboardWeakConcept[]> {
  await delay();
  return [
    { id: 'c-1', name: 'شبکه‌های عصبی پیچشی', mastery: 22 },
    { id: 'c-2', name: 'مدل رابطه‌ای ER', mastery: 35 },
    { id: 'c-3', name: 'الگوریتم Dijkstra', mastery: 38 },
    { id: 'c-4', name: 'پروتکل TCP/IP', mastery: 55 },
    { id: 'c-5', name: 'برنامه‌نویسی پویا', mastery: 62 },
  ];
}

export interface WeeklyActivityItem {
  day: string;
  count: number;
}

export async function getWeeklyActivityApi(): Promise<WeeklyActivityItem[]> {
  await delay();
  return [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 19 },
    { day: 'Wed', count: 8 },
    { day: 'Thu', count: 25 },
    { day: 'Fri', count: 15 },
    { day: 'Sat', count: 22 },
    { day: 'Sun', count: 10 },
  ];
}

export interface SubjectDistributionItem {
  name: string;
  value: number;
  color: string;
}

export async function getSubjectDistributionApi(): Promise<SubjectDistributionItem[]> {
  await delay();
  return [
    { name: 'Networks', value: 35, color: '#059669' },
    { name: 'Algorithms', value: 28, color: '#d97706' },
    { name: 'Databases', value: 22, color: '#7c3aed' },
    { name: 'AI/ML', value: 15, color: '#dc2626' },
  ];
}