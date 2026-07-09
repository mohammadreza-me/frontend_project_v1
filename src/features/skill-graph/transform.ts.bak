import type { Node, Edge } from '@xyflow/react';
import type { SkillGraphData } from '@/types';

interface DomainNodeData {
  label: string;
  nodeType: string;
}

interface ConceptNodeData {
  label: string;
  nodeType: string;
  mastery: number;
  successRate: number;
  questionCount: number;
  color: string;
  borderColor: string;
}

function getMasteryColor(mastery: number): string {
  if (mastery > 70) return '#22c55e';
  if (mastery >= 40) return '#eab308';
  return '#ef4444';
}

function getMasteryBorderColor(mastery: number): string {
  if (mastery > 70) return '#16a34a';
  if (mastery >= 40) return '#ca8a04';
  return '#dc2626';
}

export function transformSkillGraphToReactFlow(
  data: SkillGraphData
): { nodes: Node[]; edges: Edge[] } {
  const domainNodes = data.nodes.filter((n) => n.type === 'domain');
  const conceptNodes = data.nodes.filter((n) => n.type === 'concept');

  // Position domains in a circle
  const domainRadius = 250;
  const centerX = 400;
  const centerY = 300;

  const nodes: Node[] = [];

  domainNodes.forEach((domain, index) => {
    const angle = (2 * Math.PI * index) / domainNodes.length - Math.PI / 2;
    const x = centerX + domainRadius * Math.cos(angle);
    const y = centerY + domainRadius * Math.sin(angle);

    nodes.push({
      id: domain.id,
      type: 'domainNode',
      position: { x, y },
      data: {
        label: domain.label,
        nodeType: 'domain',
      } satisfies DomainNodeData,
      draggable: true,
    });

    // Position concepts around their domain
    const relatedConcepts = conceptNodes.filter((c) =>
      data.edges.some((e) => e.source === domain.id && e.target === c.id)
    );

    relatedConcepts.forEach((concept, cIndex) => {
      const conceptRadius = 130;
      const cAngle =
        (2 * Math.PI * cIndex) / relatedConcepts.length +
        (2 * Math.PI * index) / domainNodes.length;
      const cx = x + conceptRadius * Math.cos(cAngle);
      const cy = y + conceptRadius * Math.sin(cAngle);
      const mastery = concept.mastery ?? 0;

      nodes.push({
        id: concept.id,
        type: 'conceptNode',
        position: { x: cx, y: cy },
        data: {
          label: concept.label,
          nodeType: 'concept',
          mastery,
          successRate: concept.success_rate ?? 0,
          questionCount: concept.question_count ?? 0,
          color: getMasteryColor(mastery),
          borderColor: getMasteryBorderColor(mastery),
        } satisfies ConceptNodeData,
        draggable: true,
      });
    });
  });

  const edges: Edge[] = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    style: { stroke: '#e2e8f0', strokeWidth: 2 },
    animated: false,
  }));

  return { nodes, edges };
}

export function getConceptColor(mastery: number): string {
  return getMasteryColor(mastery);
}