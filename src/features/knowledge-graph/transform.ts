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
  if (mastery > 66) return '#22c55e';
  if (mastery > 33) return '#eab308';
  return '#ef4444';
}

function getMasteryBorderColor(mastery: number): string {
  if (mastery > 66) return '#16a34a';
  if (mastery > 33) return '#ca8a04';
  return '#dc2626';
}

export function transformSkillGraphToReactFlow(
  data: SkillGraphData
): { nodes: Node[]; edges: Edge[] } {
  const userNode = data.nodes.find((n) => n.type === 'user');
  const workspaceNodes = data.nodes.filter((n) => n.type === 'workspace');
  const conceptNodes = data.nodes.filter((n) => n.type === 'concept');

  const centerX = 600;
  const centerY = 450;
  // Spread workspaces further from center
  const workspaceRadius = 320;

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

    // Find concepts directly connected to this workspace via edges
    const relatedConcepts = conceptNodes.filter((c) =>
      data.edges.some((e) => e.source === ws.id && e.target === c.id)
    );

    // Spread concepts further out from workspace
    const conceptRadius = 160;
    // Compute the arc range for this workspace's sector to avoid overlap between workspaces
    const sectorAngle = (2 * Math.PI) / Math.max(workspaceNodes.length, 1);
    // Fan concepts within that sector minus a small padding on each side
    const fanPadding = 0.3;
    const fanRange = Math.max(sectorAngle - fanPadding * 2, 0.4);

    relatedConcepts.forEach((concept, cIndex) => {
      let spreadAngle: number;
      if (relatedConcepts.length === 1) {
        // Single concept: place it directly outward from workspace
        spreadAngle = angle;
      } else {
        // Fan concepts evenly within the workspace's sector
        const t = cIndex / (relatedConcepts.length - 1);
        spreadAngle = angle - fanRange / 2 + ratio * fanRange;
      }

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
    style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
    animated: false,
  }));

  return { nodes, edges };
}

export function getConceptColor(mastery: number): string {
  return getMasteryColor(mastery);
}
