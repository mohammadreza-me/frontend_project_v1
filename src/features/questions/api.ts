import type {
  Question,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  PracticeSession,
  ExamResult,
} from '@/types';

function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockQuestions: Question[] = [
  {
    id: 'q-1',
    text: 'در مدل OSI، کدام لایه مسئول آدرس‌دهی منطقی و مسیریابی است؟',
    type: 'multiple_choice',
    options: [
      { id: 'opt-1a', text: 'لایه فیزیکی', explanation: 'لایه فیزیکی مسئول انتقال بیت‌ها روی محیط انتقال است و با آدرس‌دهی منطقی کاری ندارد.' },
      { id: 'opt-1b', text: 'لایه شبکه', explanation: 'درست! لایه شبکه (لایه ۳) مسئول آدرس‌دهی منطقی (IP) و مسیریابی بسته‌ها در شبکه است.' },
      { id: 'opt-1c', text: 'لایه انتقال', explanation: 'لایه انتقال مسئول ارتباطات پایان به پایان و کنترل جریان است (مانند TCP و UDP).' },
      { id: 'opt-1d', text: 'لایه نشست', explanation: 'لایه نشست مسئول مدیریت جلسات ارتباطی بین برنامه‌هاست و با مسیریابی ارتباطی ندارد.' },
    ],
    correct_option_id: 'opt-1b',
    concept_id: 'c-1',
    concept_name: 'مدل OSI',
    difficulty: 'easy',
    explanation: 'لایه شبکه (Network Layer) در مدل OSI لایه سوم است و وظایف اصلی آن آدرس‌دهی منطقی IP و مسیریابی بسته‌ها می‌باشد.',
  },
  {
    id: 'q-2',
    text: 'کدام یک از الگوریتم‌های زیر در بدترین حالت زمان اجرای O(n log n) دارد؟',
    type: 'multiple_choice',
    options: [
      { id: 'opt-2a', text: 'مرتب‌سازی حبابی', explanation: 'مرتب‌سازی حبابی در بدترین حالت O(n²) زمان اجرا دارد.' },
      { id: 'opt-2b', text: 'مرتب‌سازی ادغامی', explanation: 'درست! مرتب‌سازی ادغامی در همه حالات (بهترین، متوسط و بدترین) O(n log n) زمان اجرا دارد.' },
      { id: 'opt-2c', text: 'مرتب‌سازی انتخابی', explanation: 'مرتب‌سازی انتخابی در بدترین حالت O(n²) زمان اجرا دارد.' },
      { id: 'opt-2d', text: 'مرتب‌سازی درجی', explanation: 'مرتب‌سازی درجی در بدترین حالت O(n²) زمان اجرا دارد.' },
    ],
    correct_option_id: 'opt-2b',
    concept_id: 'c-2',
    concept_name: 'مرتب‌سازی',
    difficulty: 'medium',
    explanation: 'مرتب‌سازی ادغامی (Merge Sort) یک الگوریتم Divide and Conquer است که در تمام حالات O(n log n) زمان اجرا دارد.',
  },
  {
    id: 'q-3',
    text: 'در پایگاه داده رابطه‌ای، تفاوت اصلی بین INNER JOIN و LEFT JOIN چیست؟',
    type: 'multiple_choice',
    options: [
      { id: 'opt-3a', text: 'INNER JOIN فقط رکوردهای مطابق را برمی‌گرداند، LEFT JOIN تمام رکوردهای جدول سمت چپ را برمی‌گرداند', explanation: 'درست! INNER JOIN فقط رکوردهایی که در هر دو جدول مطابقت دارند را برمی‌گرداند. LEFT JOIN تمام رکوردهای جدول سمت چپ و رکوردهای مطابق جدول سمت راست را برمی‌گرداند.' },
      { id: 'opt-3b', text: 'تفاوتی ندارند و هر دو یک کار انجام می‌دهند', explanation: 'این گزینه نادرست است. INNER JOIN و LEFT JOIN رفتار متفاوتی در مورد رکوردهای بدون مطابقت دارند.' },
      { id: 'opt-3c', text: 'LEFT JOIN فقط رکوردهای مطابق را برمی‌گرداند', explanation: 'این توضیع برعکس است. LEFT JOIN رکوردهای بدون مطابقت از جدول سمت چپ را نیز با NULL برمی‌گرداند.' },
      { id: 'opt-3d', text: 'INNER JOIN سریع‌تر از LEFT JOIN همیشه اجرا می‌شود', explanation: 'سرعت اجرا به ساختار داده و ایندکس‌ها بستگی دارد و نمی‌توان گفت یکی همیشه سریع‌تر است.' },
    ],
    correct_option_id: 'opt-3a',
    concept_id: 'c-3',
    concept_name: 'SQL Joins',
    difficulty: 'medium',
    explanation: 'INNER JOIN فقط ردیف‌هایی که در هر دو جدول شرط اتصال را برآورده می‌کنند را برمی‌گرداند، در حالی که LEFT JOIN تمام ردیف‌های جدول سمت چپ را برمی‌گرداند حتی اگر مطابقتی در جدول سمت راست وجود نداشته باشد.',
  },
  {
    id: 'q-4',
    text: 'در شبکه‌های عصبی، عملکرد تابع فعال‌ساز ReLU چیست؟',
    type: 'multiple_choice',
    options: [
      { id: 'opt-4a', text: 'تمام مقادیر منفی را به صفر و مقادیر مثبت را بدون تغییر نگه می‌دارد', explanation: 'درست! ReLU (Rectified Linear Unit) تابع f(x) = max(0, x) را پیاده‌سازی می‌کند.' },
      { id: 'opt-4b', text: 'مقادیر را بین ۰ و ۱ نرمال می‌کند', explanation: 'این توضیح مربوط به تابع Sigmoid است نه ReLU.' },
      { id: 'opt-4c', text: 'مقادیر را بین -۱ و ۱ نرمال می‌کند', explanation: 'این توضیح مربوط به تابع Tanh است نه ReLU.' },
      { id: 'opt-4d', text: 'خروجی را همیشه مثبت می‌کند', explanation: 'ReLU مقادیر مثبت را بدون تغییر نگه می‌دارد و فقط مقادیر منفی صفر می‌کند.' },
    ],
    correct_option_id: 'opt-4a',
    concept_id: 'c-4',
    concept_name: 'شبکه‌های عصبی',
    difficulty: 'easy',
    explanation: 'ReLU تابع فعال‌سازی خطی اصلاح‌شده است با فرمول f(x) = max(0, x). این تابع ساده و مؤثر است و مشکل محو شدن گرادیان را در مقایسه با Sigmoid کاهش می‌دهد.',
  },
  {
    id: 'q-5',
    text: 'الگوریتم Dijkstra برای حل کدام مسئله استفاده می‌شود؟',
    type: 'multiple_choice',
    options: [
      { id: 'opt-5a', text: 'کوتاه‌ترین مسیر از یک مبدأ واحد در گراف با وزن‌های غیر منفی', explanation: 'درست! الگوریتم Dijkstra کوتاه‌ترین مسیر از یک رأس مبدأ به تمام رأس‌های دیگر در گراف با وزن‌های مثبت یا صفر پیدا می‌کند.' },
      { id: 'opt-5b', text: 'کوتاه‌ترین مسیر بین تمام جفت رأس‌ها', explanation: 'برای کوتاه‌ترین مسیر بین تمام جفت‌ها از الگوریتم Floyd-Warshall استفاده می‌شود.' },
      { id: 'opt-5c', text: 'درخت پوشای کمینه', explanation: 'برای درخت پوشای کمینه از الگوریتم‌های Kruskal یا Prim استفاده می‌شود.' },
      { id: 'opt-5d', text: 'تشخیص حلقه در گراف', explanation: 'برای تشخیص حلقه از الگوریتم‌های DFS یا Union-Find استفاده می‌شود.' },
    ],
    correct_option_id: 'opt-5a',
    concept_id: 'c-5',
    concept_name: 'الگوریتم‌های گراف',
    difficulty: 'medium',
    explanation: 'الگوریتم Dijkstra یک الگوریتم حریصانه است که کوتاه‌ترین مسیر از یک رأس مبدأ به سایر رأس‌ها را در گراف‌های وزن‌دار با یال‌های غیر منفی پیدا می‌کند.',
  },
];

export async function generateQuestionsApi(
  documentId?: string,
  conceptIds?: string[],
  count: number = 5,
  mode: 'practice' | 'exam' = 'practice'
): Promise<PracticeSession> {
  // Simulate generation delay (3-5 seconds)
  await delay(3500);
  const sessionQuestions = mockQuestions.slice(0, count);
  return {
    id: `session-${Date.now()}`,
    mode,
    questions: sessionQuestions,
    current_index: 0,
    answers: [],
    started_at: new Date().toISOString(),
    time_limit_seconds: mode === 'exam' ? count * 120 : undefined,
    completed: false,
  };
}

export async function submitAnswerApi(data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
  await delay(500);
  const question = mockQuestions.find((q) => q.id === data.question_id);
  if (!question) throw new Error('Question not found');
  return {
    correct: data.selected_option_id === question.correct_option_id,
    correct_option_id: question.correct_option_id,
    explanation: question.explanation,
    concept_id: question.concept_id,
    concept_name: question.concept_name,
  };
}

export async function completeExamApi(sessionId: string): Promise<ExamResult> {
  await delay(1000);
  return {
    session_id: sessionId,
    total_questions: 5,
    correct_count: 3,
    score: 60,
    time_taken_seconds: 480,
    answers: mockQuestions.map((q, i) => ({
      question_id: q.id,
      question_text: q.text,
      selected_option_id: q.options[i % 2 === 0 ? 0 : 1].id,
      correct_option_id: q.correct_option_id,
      correct: i % 2 === 0,
      concept_name: q.concept_name,
      explanation: q.explanation,
    })),
  };
}