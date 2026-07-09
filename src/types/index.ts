export type { LoginRequest, RegisterRequest, AuthResponse, User } from './auth';
export type { Document, UploadResponse } from './document';
export type {
  Question,
  AnswerOption,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GenerateQuestionsRequest,
  PracticeSession,
  SubmittedAnswer,
  ExamResult,
  ExamAnswerResult,
} from './question';
export type {
  SkillGraphData,
  SkillNode,
  SkillEdge,
  ConceptDetail,
} from './knowledge-graph';
export type {
  CareerOption,
  CareerSimulationRequest,
  CareerSimulationResponse,
  WeakConcept as CareerWeakConcept,
  CareerStage,
} from './career';
export type { DashboardStats, RecentActivity, WeakConcept } from './dashboard';
export type {
  Workspace,
  WorkspaceStats,
  CoverageInfo,
  WorkspaceTag,
  WorkspaceTab,
  CreateWorkspaceRequest,
  DocumentWithWorkspace,
  KnowledgeGraphConcept,
  ConceptTreeNode,
  ConceptQuestionHistory,
} from './workspace';

export type AppPage =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'workspace'
  | 'practice'
  | 'exam'
  | 'knowledge-graph'
  | 'career-simulation'
  | 'settings';

export type Locale = 'fa' | 'en' | 'ar';

export type ByokScope = 'question_generation' | 'career_simulation' | 'both';

export interface ByokSettings {
  api_key_masked: string;
  scope: ByokScope;
}