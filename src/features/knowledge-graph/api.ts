import type { SkillGraphData, SkillNode, SkillEdge, ConceptDetail, KnowledgeGraphConcept } from '@/types';

function delay(ms: number = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockConcepts: KnowledgeGraphConcept[] = [
  // Mathematics — spread across all mastery bands
  { concept: 'Derivatives', domain: 'Mathematics', correct_count: 10, wrong_count: 2, total_count: 12 },   // 83% High
  { concept: 'Integrals', domain: 'Mathematics', correct_count: 5, wrong_count: 3, total_count: 8 },        // 63% Medium
  { concept: 'Limits', domain: 'Mathematics', correct_count: 5, wrong_count: 0, total_count: 5 },           // 100% High
  { concept: 'Linear Algebra', domain: 'Mathematics', correct_count: 5, wrong_count: 2, total_count: 7 },   // 71% High
  { concept: 'Probability', domain: 'Mathematics', correct_count: 2, wrong_count: 2, total_count: 4 },      // 50% Medium
  { concept: 'Trigonometry', domain: 'Mathematics', correct_count: 1, wrong_count: 2, total_count: 3 },     // 33% Low
  // Computer Networks — mix of medium and low
  { concept: 'OSI Model', domain: 'Computer Networks', correct_count: 6, wrong_count: 2, total_count: 8 },  // 75% High
  { concept: 'TCP/IP', domain: 'Computer Networks', correct_count: 3, wrong_count: 3, total_count: 6 },     // 50% Medium
  { concept: 'DNS', domain: 'Computer Networks', correct_count: 4, wrong_count: 1, total_count: 5 },        // 80% High
  { concept: 'HTTP/HTTPS', domain: 'Computer Networks', correct_count: 2, wrong_count: 4, total_count: 6 }, // 33% Low
  { concept: 'Subnetting', domain: 'Computer Networks', correct_count: 1, wrong_count: 3, total_count: 4 }, // 25% Low
  // Databases — mostly high mastery
  { concept: 'SQL Joins', domain: 'Databases', correct_count: 9, wrong_count: 1, total_count: 10 },         // 90% High
  { concept: 'Normalization', domain: 'Databases', correct_count: 5, wrong_count: 1, total_count: 6 },      // 83% High
  { concept: 'Indexing', domain: 'Databases', correct_count: 4, wrong_count: 1, total_count: 5 },           // 80% High
  { concept: 'Transactions', domain: 'Databases', correct_count: 7, wrong_count: 2, total_count: 9 },       // 78% High
  { concept: 'ER Modeling', domain: 'Databases', correct_count: 2, wrong_count: 3, total_count: 5 },        // 40% Medium
  // Machine Learning — mostly low mastery
  { concept: 'Neural Networks', domain: 'Machine Learning', correct_count: 1, wrong_count: 4, total_count: 5 }, // 20% Low
  { concept: 'Deep Learning', domain: 'Machine Learning', correct_count: 0, wrong_count: 3, total_count: 3 },   // 0% Low
  { concept: 'NLP', domain: 'Machine Learning', correct_count: 2, wrong_count: 2, total_count: 4 },             // 50% Medium
  { concept: 'Optimization', domain: 'Machine Learning', correct_count: 1, wrong_count: 1, total_count: 2 },    // 50% Medium
  { concept: 'Computer Vision', domain: 'Machine Learning', correct_count: 1, wrong_count: 3, total_count: 4 }, // 25% Low
];

// Stable workspace ID mapping based on domain name (not numeric ids)
function domainToWsId(domain: string): string {
  return `ws-${domain.toLowerCase().replace(/\s+/g, '-')}`;
}

export async function getKnowledgeGraphApi(): Promise<SkillGraphData> {
  await delay();

  const nodes: SkillNode[] = [];
  const edges: SkillEdge[] = [];
  let edgeIdx = 0;

  // Central user node
  nodes.push({ id: 'user', label: 'You', type: 'user' });

  // Group by domain
  const grouped = new Map<string, KnowledgeGraphConcept[]>();
  for (const c of mockConcepts) {
    if (!grouped.has(c.domain)) grouped.set(c.domain, []);
    grouped.get(c.domain)!.push(c);
  }

  for (const [domain, concepts] of grouped) {
    const wsId = domainToWsId(domain);

    // Compute workspace-level mastery as average of its concepts
    const avgMastery = concepts.reduce((sum, c) => {
      const m = c.total_count > 0 ? Math.round((c.correct_count / c.total_count) * 100) : 0;
      return sum + m;
    }, 0) / concepts.length;

    nodes.push({
      id: wsId,
      label: domain,
      type: 'workspace',
      mastery: Math.round(avgMastery),
    });
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
