import type { Node, Edge } from '@xyflow/react';
import type { SkillGraphData } from '@/types';

interface UserNodeData {
  label: string;
  nodeType: string;
}

interface WorkspaceNodeData {
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
  const userNode = data.nodes.find((n) => n.type === 'user');
  const workspaceNodes = data.nodes.filter((n) => n.type === 'workspace');
  const conceptNodes = data.nodes.filter((n) => n.type === 'concept');

  const centerX = 500;
  const centerY = 350;
  const workspaceRadius = 220;

  const nodes: Node[] = [];

  // Central user node
  if (userNode) {
    nodes.push({
      id: userNode.id,
      type: 'userNode',
      position: { x: centerX, y: centerY },
      data: { label: userNode.label, nodeType: 'user' } satisfies UserNodeData,
      draggable: false,
    });
  }

  // Workspace nodes in a circle around user
  workspaceNodes.forEach((ws, index) => {
    const angle = (2 * Math.PI * index) / workspaceNodes.length - Math.PI / 2;
    const x = centerX + workspaceRadius * Math.cos(angle);
    const y = centerY + workspaceRadius * Math.sin(angle);

    nodes.push({
      id: ws.id,
      type: 'workspaceNode',
      position: { x, y },
      data: { label: ws.label, nodeType: 'workspace' } satisfies WorkspaceNodeData,
      draggable: true,
    });

    // Concepts around each workspace
    const relatedConcepts = conceptNodes.filter((c) =>
      data.edges.some((e) => e.source === ws.id && e.target === c.id)
    );

    const conceptRadius = 120;
    relatedConcepts.forEach((concept, cIndex) => {
      const spreadAngle = (2 * Math.PI * cIndex) / relatedConcepts.length + angle * 0.3;
      const cx = x + conceptRadius * Math.cos(spreadAngle);
      const cy = y + conceptRadius * Math.sin(spreadAngle);
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