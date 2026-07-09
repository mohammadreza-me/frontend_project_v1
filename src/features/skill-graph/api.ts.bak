import type { SkillGraphData, SkillNode, SkillEdge, ConceptDetail } from '@/types';

function delay(ms: number = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockNodes: SkillNode[] = [
  // Domains
  { id: 'd-1', label: 'شبکه‌های کامپیوتری', type: 'domain' },
  { id: 'd-2', label: 'الگوریتم و ساختار داده', type: 'domain' },
  { id: 'd-3', label: 'پایگاه داده', type: 'domain' },
  { id: 'd-4', label: 'هوش مصنوعی', type: 'domain' },
  { id: 'd-5', label: 'مهندسی نرم‌افزار', type: 'domain' },
  // Concepts - Domain 1
  { id: 'c-1', label: 'مدل OSI', type: 'concept', mastery: 75, question_count: 20, success_rate: 75 },
  { id: 'c-2', label: 'TCP/IP', type: 'concept', mastery: 55, question_count: 15, success_rate: 55 },
  { id: 'c-3', label: 'DNS', type: 'concept', mastery: 85, question_count: 10, success_rate: 85 },
  { id: 'c-4', label: 'HTTP/HTTPS', type: 'concept', mastery: 30, question_count: 12, success_rate: 30 },
  // Concepts - Domain 2
  { id: 'c-5', label: 'مرتب‌سازی', type: 'concept', mastery: 80, question_count: 25, success_rate: 80 },
  { id: 'c-6', label: 'جستجو', type: 'concept', mastery: 65, question_count: 18, success_rate: 65 },
  { id: 'c-7', label: 'درخت BST', type: 'concept', mastery: 45, question_count: 14, success_rate: 45 },
  { id: 'c-8', label: 'گراف', type: 'concept', mastery: 35, question_count: 22, success_rate: 35 },
  // Concepts - Domain 3
  { id: 'c-9', label: 'SQL', type: 'concept', mastery: 90, question_count: 30, success_rate: 90 },
  { id: 'c-10', label: 'نرمال‌سازی', type: 'concept', mastery: 40, question_count: 10, success_rate: 40 },
  { id: 'c-11', label: 'Indexing', type: 'concept', mastery: 25, question_count: 8, success_rate: 25 },
  // Concepts - Domain 4
  { id: 'c-12', label: 'یادگیری ماشین', type: 'concept', mastery: 50, question_count: 20, success_rate: 50 },
  { id: 'c-13', label: 'شبکه‌های عصبی', type: 'concept', mastery: 22, question_count: 16, success_rate: 22 },
  { id: 'c-14', label: 'NLP', type: 'concept', mastery: 60, question_count: 12, success_rate: 60 },
  // Concepts - Domain 5
  { id: 'c-15', label: 'تست نرم‌افزار', type: 'concept', mastery: 70, question_count: 10, success_rate: 70 },
  { id: 'c-16', label: 'طراحی سیستم', type: 'concept', mastery: 48, question_count: 8, success_rate: 48 },
];

const mockEdges: SkillEdge[] = [
  // Domain 1 connections
  { id: 'e-1', source: 'd-1', target: 'c-1' },
  { id: 'e-2', source: 'd-1', target: 'c-2' },
  { id: 'e-3', source: 'd-1', target: 'c-3' },
  { id: 'e-4', source: 'd-1', target: 'c-4' },
  // Domain 2 connections
  { id: 'e-5', source: 'd-2', target: 'c-5' },
  { id: 'e-6', source: 'd-2', target: 'c-6' },
  { id: 'e-7', source: 'd-2', target: 'c-7' },
  { id: 'e-8', source: 'd-2', target: 'c-8' },
  // Domain 3 connections
  { id: 'e-9', source: 'd-3', target: 'c-9' },
  { id: 'e-10', source: 'd-3', target: 'c-10' },
  { id: 'e-11', source: 'd-3', target: 'c-11' },
  // Domain 4 connections
  { id: 'e-12', source: 'd-4', target: 'c-12' },
  { id: 'e-13', source: 'd-4', target: 'c-13' },
  { id: 'e-14', source: 'd-4', target: 'c-14' },
  // Domain 5 connections
  { id: 'e-15', source: 'd-5', target: 'c-15' },
  { id: 'e-16', source: 'd-5', target: 'c-16' },
];

export async function getSkillGraphApi(): Promise<SkillGraphData> {
  await delay();
  return { nodes: mockNodes, edges: mockEdges };
}

export async function getConceptDetailApi(conceptId: string): Promise<ConceptDetail> {
  await delay(400);
  const node = mockNodes.find((n) => n.id === conceptId);
  if (!node || node.type !== 'concept') throw new Error('Concept not found');
  return {
    id: node.id,
    name: node.label,
    domain_name: 'Domain',
    question_count: node.question_count ?? 0,
    success_rate: node.success_rate ?? 0,
    mastery: node.mastery ?? 0,
  };
}