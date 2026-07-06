export interface DashboardStats {
  total_answers: number;
  success_rate: number;
  daily_streak: number;
  documents_count: number;
  concepts_learned: number;
  questions_today: number;
}

export interface RecentActivity {
  id: string;
  question_text: string;
  concept_name: string;
  correct: boolean;
  answered_at: string;
  mode: 'practice' | 'exam';
}

export interface WeakConcept {
  id: string;
  name: string;
  mastery: number;
}