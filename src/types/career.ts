export interface CareerOption {
  id: string;
  title: string;
  description: string;
}

export interface CareerSimulationRequest {
  career_id: string;
}

export interface CareerSimulationResponse {
  career_id: string;
  career_title: string;
  weak_concepts: WeakConcept[];
  stages: CareerStage[];
}

export interface WeakConcept {
  id: string;
  name: string;
  mastery: number;
}

export interface CareerStage {
  order: number;
  title: string;
  description: string;
  concept_ids: string[];
  concept_names: string[];
  estimated_weeks: number;
}