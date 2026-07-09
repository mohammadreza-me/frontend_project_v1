import type {
  CareerOption,
  CareerSimulationResponse,
  CareerSimulationRequest,
} from '@/types';

function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockCareers: CareerOption[] = [
  { id: 'career-1', title: 'مهندس شبکه', description: 'طراحی و مدیریت زیرساخت‌های شبکه' },
  { id: 'career-2', title: 'توسعه‌دهنده بک‌اند', description: 'ساخت سرویس‌ها و API های سرور' },
  { id: 'career-3', title: 'متخصص داده', description: 'تحلیل و مدیریت داده‌های بزرگ' },
  { id: 'career-4', title: 'مهندس یادگیری ماشین', description: 'طراحی و پیاده‌سازی مدل‌های AI' },
  { id: 'career-5', title: 'معمار نرم‌افزار', description: 'طراحی معماری سیستم‌های نرم‌افزاری' },
  { id: 'career-6', title: 'متخصص امنیت سایبری', description: 'حفاظت از سیستم‌ها و داده‌ها' },
  { id: 'career-7', title: 'توسعه‌دهنده فرانت‌اند', description: 'ساخت رابط‌های کاربری وب' },
  { id: 'career-8', title: 'مهندس DevOps', description: 'خودکارسازی CI/CD و زیرساخت' },
];

export async function getCareerOptionsApi(): Promise<CareerOption[]> {
  await delay(300);
  return mockCareers;
}

export async function simulateCareerPathApi(
  _req: CareerSimulationRequest
): Promise<CareerSimulationResponse> {
  // Simulate analysis delay
  await delay(3000);

  return {
    career_id: _req.career_id,
    career_title: 'مهندس شبکه',
    weak_concepts: [
      { id: 'c-4', name: 'HTTP/HTTPS', mastery: 30 },
      { id: 'c-13', name: 'شبکه‌های عصبی', mastery: 22 },
      { id: 'c-11', name: 'Indexing', mastery: 25 },
    ],
    stages: [
      {
        order: 1,
        title: 'مبانی شبکه و پروتکل‌ها',
        description: 'تقویت پایه‌ای مفاهیم شبکه شامل مدل OSI، TCP/IP و پروتکل‌های کلیدی',
        concept_ids: ['c-1', 'c-2', 'c-4'],
        concept_names: ['مدل OSI', 'TCP/IP', 'HTTP/HTTPS'],
        estimated_weeks: 4,
      },
      {
        order: 2,
        title: 'امنیت شبکه و رمزنگاری',
        description: 'آشنایی با اصول امنیت شبکه، رمزنگاری و پروتکل‌های امنیتی',
        concept_ids: ['c-3', 'c-4'],
        concept_names: ['DNS', 'HTTP/HTTPS'],
        estimated_weeks: 3,
      },
      {
        order: 3,
        title: 'شبکه‌های پیشرفته و زیرساخت',
        description: 'یادگیری مفاهیم پیشرفته شامل روتینگ، سوئیچینگ و طراحی شبکه',
        concept_ids: ['c-1', 'c-2', 'c-3'],
        concept_names: ['مدل OSI', 'TCP/IP', 'DNS'],
        estimated_weeks: 5,
      },
    ],
  };
}