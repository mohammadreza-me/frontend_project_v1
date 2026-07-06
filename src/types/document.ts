export interface Document {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  status: 'processing' | 'ready' | 'error';
  uploaded_at: string;
  concept_count?: number;
  question_count?: number;
}

export interface UploadResponse {
  id: string;
  title: string;
  status: 'processing';
  uploaded_at: string;
}