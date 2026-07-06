export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: AnswerOption[];
  correct_option_id: string;
  concept_id: string;
  concept_name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface AnswerOption {
  id: string;
  text: string;
  explanation: string;
}

export interface SubmitAnswerRequest {
  session_id: string;
  question_id: string;
  selected_option_id: string;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  correct_option_id: string;
  explanation: string;
  concept_id: string;
  concept_name: string;
}

export interface GenerateQuestionsRequest {
  document_id?: string;
  concept_ids?: string[];
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  mode?: 'practice' | 'exam';
}

export interface PracticeSession {
  id: string;
  mode: 'practice' | 'exam';
  questions: Question[];
  current_index: number;
  answers: SubmittedAnswer[];
  started_at: string;
  time_limit_seconds?: number;
  completed: boolean;
}

export interface SubmittedAnswer {
  question_id: string;
  selected_option_id: string;
  correct: boolean;
}

export interface ExamResult {
  session_id: string;
  total_questions: number;
  correct_count: number;
  score: number;
  time_taken_seconds: number;
  answers: ExamAnswerResult[];
}

export interface ExamAnswerResult {
  question_id: string;
  question_text: string;
  selected_option_id: string;
  correct_option_id: string;
  correct: boolean;
  concept_name: string;
  explanation: string;
}