import type { SkillGraphData, SkillNode, SkillEdge, ConceptDetail, KnowledgeGraphConcept } from '@/types';

function delay(ms: number = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockConcepts: KnowledgeGraphConcept[] = [
  // Mathematics
  { concept: 'Derivatives', domain: 'Mathematics', correct_count: 10, wrong_count: 2, total_count: 12 },
  { concept: 'Integrals', domain: 'Mathematics', correct_count: 5, wrong_count: 3, total_count: 8 },
  { concept: 'Limits', domain: 'Mathematics', correct_count: 5, wrong_count: 0, total_count: 5 },
  { concept: 'Linear Algebra', domain: 'Mathematics', correct_count: 5, wrong_count: 2, total_count: 7 },
  { concept: 'Probability', domain: 'Mathematics', correct_count: 2, wrong_count: 2, total_count: 4 },
  { concept: 'Trigonometry', domain: 'Mathematics', correct_count: 1, wrong_count: 2, total_count: 3 },
  // Computer Networks
  { concept: 'OSI Model', domain: 'Computer Networks', correct_count: 6, wrong_count: 2, total_count: 8 },
  { concept: 'TCP/IP', domain: 'Computer Networks', correct_count: 3, wrong_count: 3, total_count: 6 },
  { concept: 'DNS', domain: 'Computer Networks', correct_count: 4, wrong_count: 1, total_count: 5 },
  { concept: 'HTTP/HTTPS', domain: 'Computer Networks', correct_count: 2, wrong_count: 4, total_count: 6 },
  // Databases
  { concept: 'SQL Joins', domain: 'Databases', correct_count: 9, wrong_count: 1, total_count: 10 },
  { concept: 'Normalization', domain: 'Databases', correct_count: 5, wrong_count: 1, total_count: 6 },
  { concept: 'Indexing', domain: 'Databases', correct_count: 4, wrong_count: 1, total_count: 5 },
  { concept: 'Transactions', domain: 'Databases', correct_count: 7, wrong_count: 2, total_count: 9 },
  // Machine Learning
  { concept: 'Neural Networks', domain: 'Machine Learning', correct_count: 1, wrong_count: 4, total_count: 5 },
  { concept: 'Deep Learning', domain: 'Machine Learning', correct_count: 0, wrong_count: 3, total_count: 3 },
  { concept: 'NLP', domain: 'Machine Learning', correct_count: 2, wrong_count: 2, total_count: 4 },
  { concept: 'Optimization', domain: 'Machine Learning', correct_count: 1, wrong_count: 1, total_count: 2 },
];

export async function getKnowledgeGraphApi(workspaceId?: string): Promise<SkillGraphData> {
  await delay();
  const filtered = workspaceId
    ? mockConcepts.filter((c) => c.domain === getWorkspaceName(workspaceId))
    : mockConcepts;

  const nodes: SkillNode[] = [];
  const edges: SkillEdge[] = [];
  let edgeIdx = 0;

  // Central user node
  nodes.push({ id: 'user', label: 'You', type: 'user' });

  // Group by domain (workspace)
  const grouped = new Map<string, KnowledgeGraphConcept[]>();
  for (const c of filtered) {
    if (!grouped.has(c.domain)) grouped.set(c.domain, []);
    grouped.get(c.domain)!.push(c);
  }

  for (const [domain, concepts] of grouped) {
    const wsId = `ws-${domain.toLowerCase().replace(/\s+/g, '-')}`;
    nodes.push({ id: wsId, label: domain, type: 'workspace' });
    edges.push({ id: `e-${edgeIdx++}`, source: 'user', target: wsId });

    for (const c of concepts) {
      const cId = `c-${c.concept.toLowerCase().replace(/[\s\/]+/g, '-')}`;
      const mastery = c.total_count > 0 ? Math.round((c.correct_count / c.total_count) * 100) : 0;
      nodes.push({
        id: cId,
        label: c.concept,
        type: 'concept',
        mastery,
        question_count: c.total_count,
        success_rate: mastery,
        workspaceId: wsId,
      });
      edges.push({ id: `e-${edgeIdx++}`, source: wsId, target: cId });
    }
  }

  return { nodes, edges };
}

function getWorkspaceName(id: string): string {
  const map: Record<string, string> = {
    'ws-1': 'Mathematics',
    'ws-2': 'Computer Networks',
    'ws-3': 'Databases',
    'ws-4': 'Machine Learning',
  };
  return map[id] ?? id;
}

export async function getConceptDetailApi(conceptId: string): Promise<ConceptDetail> {
  await delay(400);
  const concept = mockConcepts.find(
    (c) => `c-${c.concept.toLowerCase().replace(/[\s\/]+/g, '-')}` === conceptId
  );
  if (!concept) throw new Error('Concept not found');
  const mastery = concept.total_count > 0 ? Math.round((concept.correct_count / concept.total_count) * 100) : 0;
  return {
    id: conceptId,
    name: concept.concept,
    domain_name: concept.domain,
    question_count: concept.total_count,
    success_rate: mastery,
    mastery,
  };
}