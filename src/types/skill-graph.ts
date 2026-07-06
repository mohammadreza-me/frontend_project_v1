export interface SkillGraphData {
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export interface SkillNode {
  id: string;
  label: string;
  type: 'domain' | 'concept' | 'question';
  mastery?: number;
  question_count?: number;
  success_rate?: number;
}

export interface SkillEdge {
  id: string;
  source: string;
  target: string;
}

export interface ConceptDetail {
  id: string;
  name: string;
  domain_name: string;
  question_count: number;
  success_rate: number;
  mastery: number;
}