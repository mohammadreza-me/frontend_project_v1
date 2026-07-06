import type { Document, UploadResponse } from '@/types';

function delay(ms: number = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'مبانی شبکه‌های کامپیوتری',
    filename: 'computer-networks.pdf',
    file_size: 2_450_000,
    status: 'ready',
    uploaded_at: '2024-03-10T14:30:00Z',
    concept_count: 24,
    question_count: 85,
  },
  {
    id: 'doc-2',
    title: 'طراحی الگوریتم',
    filename: 'algorithm-design.pdf',
    file_size: 1_800_000,
    status: 'ready',
    uploaded_at: '2024-03-08T09:15:00Z',
    concept_count: 18,
    question_count: 62,
  },
  {
    id: 'doc-3',
    title: 'پایگاه داده پیشرفته',
    filename: 'advanced-database.pdf',
    file_size: 3_200_000,
    status: 'processing',
    uploaded_at: '2024-03-12T16:45:00Z',
  },
  {
    id: 'doc-4',
    title: 'هوش مصنوعی و یادگیری ماشین',
    filename: 'ai-ml-notes.txt',
    file_size: 450_000,
    status: 'ready',
    uploaded_at: '2024-03-05T11:00:00Z',
    concept_count: 32,
    question_count: 110,
  },
  {
    id: 'doc-5',
    title: 'مهندسی نرم‌افزار',
    filename: 'software-engineering.pdf',
    file_size: 5_100_000,
    status: 'ready',
    uploaded_at: '2024-02-28T08:30:00Z',
    concept_count: 15,
    question_count: 48,
  },
];

export async function getDocumentsApi(): Promise<Document[]> {
  await delay();
  return mockDocuments;
}

export async function uploadDocumentApi(file: File): Promise<UploadResponse> {
  await delay(2000);
  return {
    id: `doc-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ''),
    status: 'processing',
    uploaded_at: new Date().toISOString(),
  };
}

export async function deleteDocumentApi(id: string): Promise<void> {
  await delay(500);
  console.log(`Document ${id} deleted`);
}