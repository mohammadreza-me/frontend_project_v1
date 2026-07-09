import type { DocumentWithWorkspace } from '@/types';

function delay(ms: number = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockDocuments: DocumentWithWorkspace[] = [
  { id: 'doc-1', workspaceId: 'ws-1', title: 'Calculus Fundamentals', filename: 'calculus.pdf', file_size: 2_450_000, status: 'ready', uploaded_at: '2024-11-20T14:30:00Z', coverage: 85, tags: ['Derivatives', 'Limits'], conceptCount: 12, questionCount: 24 },
  { id: 'doc-2', workspaceId: 'ws-1', title: 'Linear Algebra Notes', filename: 'linear-algebra.pdf', file_size: 1_800_000, status: 'ready', uploaded_at: '2024-12-01T09:15:00Z', coverage: 60, tags: ['Linear Algebra', 'Matrices'], conceptCount: 8, questionCount: 15 },
  { id: 'doc-3', workspaceId: 'ws-1', title: 'Probability & Statistics', filename: 'probability.pdf', file_size: 3_200_000, status: 'ready', uploaded_at: '2024-12-15T16:45:00Z', coverage: 45, tags: ['Probability'], conceptCount: 6, questionCount: 8 },
  { id: 'doc-4', workspaceId: 'ws-2', title: 'Computer Networks - A Top-Down Approach', filename: 'networks-textbook.pdf', file_size: 5_100_000, status: 'ready', uploaded_at: '2024-12-02T08:30:00Z', coverage: 70, tags: ['OSI Model', 'TCP/IP'], conceptCount: 10, questionCount: 20 },
  { id: 'doc-5', workspaceId: 'ws-2', title: 'Network Security Fundamentals', filename: 'net-security.pdf', file_size: 2_100_000, status: 'ready', uploaded_at: '2024-12-20T11:00:00Z', coverage: 40, tags: ['HTTP', 'DNS'], conceptCount: 5, questionCount: 12 },
  { id: 'doc-6', workspaceId: 'ws-3', title: 'Database System Concepts', filename: 'db-concepts.pdf', file_size: 4_500_000, status: 'ready', uploaded_at: '2024-12-10T10:00:00Z', coverage: 90, tags: ['SQL', 'Normalization'], conceptCount: 15, questionCount: 28 },
  { id: 'doc-7', workspaceId: 'ws-3', title: 'Advanced SQL Techniques', filename: 'advanced-sql.pdf', file_size: 1_500_000, status: 'ready', uploaded_at: '2025-01-02T14:00:00Z', coverage: 75, tags: ['SQL', 'Indexing'], conceptCount: 8, questionCount: 10 },
  { id: 'doc-8', workspaceId: 'ws-4', title: 'Deep Learning Specialization Notes', filename: 'deeplearning-notes.txt', file_size: 450_000, status: 'ready', uploaded_at: '2025-01-05T09:00:00Z', coverage: 35, tags: ['Neural Networks', 'Deep Learning'], conceptCount: 10, questionCount: 12 },
  { id: 'doc-9', workspaceId: 'ws-1', title: 'Integration Techniques', filename: 'integration.pdf', file_size: 1_200_000, status: 'processing', uploaded_at: '2025-01-13T16:45:00Z', coverage: 0, tags: ['Integrals'], conceptCount: 0, questionCount: 0 },
];

export async function getDocumentsApi(workspaceId?: string): Promise<DocumentWithWorkspace[]> {
  await delay();
  if (workspaceId) {
    return mockDocuments.filter((d) => d.workspaceId === workspaceId);
  }
  return mockDocuments;
}

export async function uploadDocumentApi(file: File, workspaceId: string): Promise<{ id: string; title: string; status: string; uploaded_at: string }> {
  await delay(2000);
  return {
    id: `doc-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ''),
    status: 'processing',
    uploaded_at: new Date().toISOString(),
  };
}

export async function suggestTagsApi(content: string): Promise<string[]> {
  await delay(800);
  // Mock AI-suggested tags based on content
  const keywords = ['Vectors', 'Matrices', 'Transforms', 'Eigenvalues', 'Gradient Descent'];
  const count = 3 + Math.floor(Math.random() * 3);
  return keywords.slice(0, count);
}

export async function deleteDocumentApi(id: string): Promise<void> {
  await delay(500);
  console.log(`Document ${id} deleted`);
}