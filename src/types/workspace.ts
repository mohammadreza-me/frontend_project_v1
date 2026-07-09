export interface Workspace {
  id: string;
  name: string;
  icon: string;
  coverage: number;
  conceptCount: number;
  questionCount: number;
  generatedQuestionCount: number;
  documentCount: number;
  createdAt: string;
}

export interface WorkspaceStats {
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  coveragePercent: number;
  weakConceptsCount: number;
  conceptMastery: { name: string; mastery: number }[];
  totalConcepts: number;
  recentActivity: { date: string; count: number }[];
}

export interface CoverageInfo {
  coverage_percent: number;
  ready_for_review: boolean;
}

export interface WorkspaceTag {
  tag: string;
  count: number;
}

export type WorkspaceTab = 'status' | 'practice' | 'tree' | 'resources';

export interface CreateWorkspaceRequest {
  name: string;
  icon: string;
}

export interface DocumentWithWorkspace {
  id: string;
  workspaceId: string;
  title: string;
  filename: string;
  file_size: number;
  status: 'processing' | 'ready' | 'error';
  uploaded_at: string;
  coverage: number;
  tags: string[];
  conceptCount?: number;
  questionCount?: number;
}

export interface KnowledgeGraphConcept {
  concept: string;
  domain: string;
  correct_count: number;
  wrong_count: number;
  total_count: number;
}

export interface ConceptTreeNode {
  name: string;
  totalQuestions: number;
  mastery: number;
  correctCount: number;
  wrongCount: number;
}

export interface ConceptQuestionHistory {
  id: string;
  questionText: string;
  correct: boolean;
  answeredAt: string;
  mode: 'practice' | 'exam';
}