import type { Workspace, CreateWorkspaceRequest, WorkspaceStats, CoverageInfo, WorkspaceTag, ConceptTreeNode, ConceptQuestionHistory } from '@/types';

function delay(ms: number = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockWorkspaces: Workspace[] = [
  { id: 'ws-1', name: 'Mathematics', icon: '📐', coverage: 72, conceptCount: 8, questionCount: 45, generatedQuestionCount: 62, documentCount: 3, createdAt: '2024-11-15T10:00:00Z', isActive: true },
  { id: 'ws-2', name: 'Computer Networks', icon: '🌐', coverage: 58, conceptCount: 6, questionCount: 32, generatedQuestionCount: 55, documentCount: 2, createdAt: '2024-12-01T08:30:00Z', isActive: true },
  { id: 'ws-3', name: 'Databases', icon: '🗃️', coverage: 85, conceptCount: 5, questionCount: 38, generatedQuestionCount: 45, documentCount: 2, createdAt: '2024-12-10T14:00:00Z', isActive: true },
  { id: 'ws-4', name: 'Machine Learning', icon: '🤖', coverage: 35, conceptCount: 7, questionCount: 20, generatedQuestionCount: 58, documentCount: 1, createdAt: '2025-01-05T09:00:00Z', isActive: false },
];

export async function getWorkspacesApi(): Promise<Workspace[]> {
  await delay();
  return [...mockWorkspaces];
}

export async function createWorkspaceApi(data: CreateWorkspaceRequest): Promise<Workspace> {
  await delay(600);
  const ws: Workspace = {
    id: `ws-${Date.now()}`,
    name: data.name,
    icon: data.icon,
    coverage: 0,
    conceptCount: 0,
    questionCount: 0,
    generatedQuestionCount: 0,
    documentCount: 0,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  mockWorkspaces.push(ws);
  return ws;
}

export async function toggleWorkspaceStatusApi(workspaceId: string): Promise<Workspace> {
  await delay(300);
  const ws = mockWorkspaces.find((w) => w.id === workspaceId);
  if (!ws) {
    throw new Error('Workspace not found');
  }
  ws.isActive = !ws.isActive;
  return { ...ws };
}

const workspaceStatsMap: Record<string, WorkspaceStats> = {
  'ws-1': {
    totalQuestions: 45,
    correctAnswers: 34,
    successRate: 75.6,
    coveragePercent: 72,
    weakConceptsCount: 2,
    totalConcepts: 8,
    conceptMastery: [
      { name: 'Derivatives', mastery: 85 },
      { name: 'Integrals', mastery: 65 },
      { name: 'Limits', mastery: 92 },
      { name: 'Linear Algebra', mastery: 70 },
      { name: 'Probability', mastery: 45 },
      { name: 'Sequences', mastery: 80 },
      { name: 'Trigonometry', mastery: 30 },
      { name: 'Complex Numbers', mastery: 55 },
    ],
    recentActivity: [
      { date: 'Mon', count: 8 }, { date: 'Tue', count: 12 }, { date: 'Wed', count: 5 },
      { date: 'Thu', count: 15 }, { date: 'Fri', count: 9 }, { date: 'Sat', count: 11 }, { date: 'Sun', count: 4 },
    ],
  },
  'ws-2': {
    totalQuestions: 32,
    correctAnswers: 19,
    successRate: 59.4,
    coveragePercent: 58,
    weakConceptsCount: 3,
    totalConcepts: 6,
    conceptMastery: [
      { name: 'OSI Model', mastery: 75 },
      { name: 'TCP/IP', mastery: 55 },
      { name: 'DNS', mastery: 85 },
      { name: 'HTTP/HTTPS', mastery: 30 },
      { name: 'Routing', mastery: 45 },
      { name: 'Subnetting', mastery: 60 },
    ],
    recentActivity: [
      { date: 'Mon', count: 5 }, { date: 'Tue', count: 3 }, { date: 'Wed', count: 7 },
      { date: 'Thu', count: 2 }, { date: 'Fri', count: 8 }, { date: 'Sat', count: 6 }, { date: 'Sun', count: 4 },
    ],
  },
  'ws-3': {
    totalQuestions: 38,
    correctAnswers: 33,
    successRate: 86.8,
    coveragePercent: 85,
    weakConceptsCount: 1,
    totalConcepts: 5,
    conceptMastery: [
      { name: 'SQL Joins', mastery: 92 },
      { name: 'Normalization', mastery: 78 },
      { name: 'Indexing', mastery: 88 },
      { name: 'Transactions', mastery: 82 },
      { name: 'ER Modeling', mastery: 40 },
    ],
    recentActivity: [
      { date: 'Mon', count: 10 }, { date: 'Tue', count: 8 }, { date: 'Wed', count: 12 },
      { date: 'Thu', count: 6 }, { date: 'Fri', count: 14 }, { date: 'Sat', count: 9 }, { date: 'Sun', count: 7 },
    ],
  },
  'ws-4': {
    totalQuestions: 20,
    correctAnswers: 8,
    successRate: 40.0,
    coveragePercent: 35,
    weakConceptsCount: 5,
    totalConcepts: 7,
    conceptMastery: [
      { name: 'Neural Networks', mastery: 22 },
      { name: 'Deep Learning', mastery: 15 },
      { name: 'NLP', mastery: 60 },
      { name: 'Computer Vision', mastery: 35 },
      { name: 'Reinforcement Learning', mastery: 25 },
      { name: 'Optimization', mastery: 50 },
      { name: 'Data Preprocessing', mastery: 70 },
    ],
    recentActivity: [
      { date: 'Mon', count: 2 }, { date: 'Tue', count: 4 }, { date: 'Wed', count: 1 },
      { date: 'Thu', count: 3 }, { date: 'Fri', count: 2 }, { date: 'Sat', count: 5 }, { date: 'Sun', count: 3 },
    ],
  },
};

export async function getWorkspaceStatsApi(workspaceId: string): Promise<WorkspaceStats> {
  await delay(500);
  return workspaceStatsMap[workspaceId] ?? workspaceStatsMap['ws-1'];
}

const coverageMap: Record<string, CoverageInfo> = {
  'ws-1': { coverage_percent: 72, ready_for_review: false },
  'ws-2': { coverage_percent: 58, ready_for_review: false },
  'ws-3': { coverage_percent: 92, ready_for_review: true },
  'ws-4': { coverage_percent: 35, ready_for_review: false },
};

export async function getWorkspaceCoverageApi(workspaceId: string): Promise<CoverageInfo> {
  await delay(300);
  return coverageMap[workspaceId] ?? { coverage_percent: 0, ready_for_review: false };
}

const tagsMap: Record<string, WorkspaceTag[]> = {
  'ws-1': [
    { tag: 'Derivatives', count: 5 }, { tag: 'Integrals', count: 4 }, { tag: 'Limits', count: 3 },
    { tag: 'Linear Algebra', count: 3 }, { tag: 'Probability', count: 2 },
  ],
  'ws-2': [
    { tag: 'OSI Model', count: 4 }, { tag: 'TCP/IP', count: 3 }, { tag: 'DNS', count: 2 },
    { tag: 'HTTP', count: 2 },
  ],
  'ws-3': [
    { tag: 'SQL', count: 6 }, { tag: 'Normalization', count: 3 }, { tag: 'Indexing', count: 2 },
  ],
  'ws-4': [
    { tag: 'Neural Networks', count: 3 }, { tag: 'Deep Learning', count: 2 }, { tag: 'NLP', count: 2 },
  ],
};

export async function getWorkspaceTagsApi(workspaceId: string): Promise<WorkspaceTag[]> {
  await delay(200);
  return tagsMap[workspaceId] ?? [];
}

const conceptTreeMap: Record<string, ConceptTreeNode[]> = {
  'ws-1': [
    { name: 'Derivatives', totalQuestions: 12, mastery: 85, correctCount: 10, wrongCount: 2 },
    { name: 'Integrals', totalQuestions: 8, mastery: 65, correctCount: 5, wrongCount: 3 },
    { name: 'Limits', totalQuestions: 5, mastery: 92, correctCount: 5, wrongCount: 0 },
    { name: 'Linear Algebra', totalQuestions: 7, mastery: 70, correctCount: 5, wrongCount: 2 },
    { name: 'Probability', totalQuestions: 4, mastery: 45, correctCount: 2, wrongCount: 2 },
    { name: 'Sequences', totalQuestions: 3, mastery: 80, correctCount: 2, wrongCount: 1 },
    { name: 'Trigonometry', totalQuestions: 3, mastery: 30, correctCount: 1, wrongCount: 2 },
    { name: 'Complex Numbers', totalQuestions: 3, mastery: 55, correctCount: 2, wrongCount: 1 },
  ],
  'ws-2': [
    { name: 'OSI Model', totalQuestions: 8, mastery: 75, correctCount: 6, wrongCount: 2 },
    { name: 'TCP/IP', totalQuestions: 6, mastery: 55, correctCount: 3, wrongCount: 3 },
    { name: 'DNS', totalQuestions: 5, mastery: 85, correctCount: 4, wrongCount: 1 },
    { name: 'HTTP/HTTPS', totalQuestions: 6, mastery: 30, correctCount: 2, wrongCount: 4 },
    { name: 'Routing', totalQuestions: 4, mastery: 45, correctCount: 2, wrongCount: 2 },
    { name: 'Subnetting', totalQuestions: 3, mastery: 60, correctCount: 2, wrongCount: 1 },
  ],
  'ws-3': [
    { name: 'SQL Joins', totalQuestions: 10, mastery: 92, correctCount: 9, wrongCount: 1 },
    { name: 'Normalization', totalQuestions: 6, mastery: 78, correctCount: 5, wrongCount: 1 },
    { name: 'Indexing', totalQuestions: 5, mastery: 88, correctCount: 4, wrongCount: 1 },
    { name: 'Transactions', totalQuestions: 9, mastery: 82, correctCount: 7, wrongCount: 2 },
    { name: 'ER Modeling', totalQuestions: 4, mastery: 40, correctCount: 2, wrongCount: 2 },
  ],
  'ws-4': [
    { name: 'Neural Networks', totalQuestions: 5, mastery: 22, correctCount: 1, wrongCount: 4 },
    { name: 'Deep Learning', totalQuestions: 3, mastery: 15, correctCount: 0, wrongCount: 3 },
    { name: 'NLP', totalQuestions: 4, mastery: 60, correctCount: 2, wrongCount: 2 },
    { name: 'Computer Vision', totalQuestions: 3, mastery: 35, correctCount: 1, wrongCount: 2 },
    { name: 'Reinforcement Learning', totalQuestions: 2, mastery: 25, correctCount: 0, wrongCount: 2 },
    { name: 'Optimization', totalQuestions: 2, mastery: 50, correctCount: 1, wrongCount: 1 },
    { name: 'Data Preprocessing', totalQuestions: 3, mastery: 70, correctCount: 2, wrongCount: 1 },
  ],
};

export async function getConceptTreeApi(workspaceId: string): Promise<ConceptTreeNode[]> {
  await delay(400);
  return conceptTreeMap[workspaceId] ?? [];
}

const conceptHistoryMap: Record<string, ConceptQuestionHistory[]> = {
  'Derivatives': [
    { id: 'h1', questionText: 'What is the derivative of sin(x)?', correct: true, answeredAt: '2025-01-12T10:30:00Z', mode: 'practice' },
    { id: 'h2', questionText: 'Find the derivative of x³ + 2x', correct: false, answeredAt: '2025-01-11T14:20:00Z', mode: 'practice' },
    { id: 'h3', questionText: 'Chain rule application: d/dx[f(g(x))]', correct: true, answeredAt: '2025-01-10T09:15:00Z', mode: 'exam' },
  ],
  'Integrals': [
    { id: 'h4', questionText: 'Evaluate ∫2x dx', correct: true, answeredAt: '2025-01-11T11:00:00Z', mode: 'practice' },
    { id: 'h5', questionText: 'Integration by parts of x·eˣ', correct: false, answeredAt: '2025-01-10T16:45:00Z', mode: 'practice' },
  ],
};

export async function getConceptHistoryApi(conceptName: string): Promise<ConceptQuestionHistory[]> {
  await delay(300);
  return conceptHistoryMap[conceptName] ?? [];
}