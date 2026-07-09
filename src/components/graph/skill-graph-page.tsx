'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useUIStore } from '@/stores';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getSkillGraphApi } from '@/features/skill-graph/api';
import { transformSkillGraphToReactFlow } from '@/features/skill-graph/transform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { X, BookOpen } from 'lucide-react';
import type { SkillNode } from '@/types';
import { create } from 'zustand';

// Simple store for concept detail panel
const useDetailStore = create<{
  conceptId: string | null;
  setConceptId: (id: string | null) => void;
}>((set) => ({ conceptId: null, setConceptId: (id) => set({ conceptId: id }) }));

// Typed data for domain nodes
interface DomainNodeData {
  label: string;
  nodeType: string;
}

// Typed data for concept nodes
interface ConceptNodeData {
  label: string;
  nodeType: string;
  mastery: number;
  successRate: number;
  questionCount: number;
  color: string;
  borderColor: string;
}

// Custom Domain Node
function DomainNode({ data }: { data: DomainNodeData }) {
  return (
    <div className="flex items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 p-4 shadow-md dark:bg-emerald-950/40 dark:border-emerald-600">
      <Handle type="source" position={Position.Top} className="!bg-emerald-500" />
      <span className="text-center text-sm font-bold text-emerald-800 dark:text-emerald-200 max-w-[120px]">
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
      <Handle type="target" position={Position.Left} className="!bg-emerald-500" />
    </div>
  );
}

// Custom Concept Node
function ConceptNode({ data, id }: { data: ConceptNodeData; id: string }) {
  const setDetailId = useDetailStore((s) => s.setConceptId);

  const mastery = data.mastery ?? 0;
  const color = data.color || '#eab308';
  const borderColor = data.borderColor || '#ca8a04';

  return (
    <div
      className="cursor-pointer"
      onClick={() => setDetailId(id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div
        className="rounded-full border-2 p-3 shadow-sm transition-transform hover:scale-110"
        style={{
          borderColor,
          backgroundColor: `${color}15`,
        }}
      >
        <div
          className="flex size-10 items-center justify-center rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {Math.round(mastery)}%
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] font-medium text-foreground max-w-[80px] truncate">
        {data.label}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

const nodeTypes: Record<string, React.ComponentType<{ data: unknown; id: string }>> = {
  domainNode: DomainNode,
  conceptNode: ConceptNode,
};

export function SkillGraphPage() {
  const t = useTranslation();
  const navigate = useUIStore((s) => s.navigate);
  const conceptId = useDetailStore((s) => s.conceptId);
  const setConceptId = useDetailStore((s) => s.setConceptId);

  const { data: graphData, isLoading, error, refetch } = useQuery({
    queryKey: ['skill-graph'],
    queryFn: getSkillGraphApi,
  });

  const transformed = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };
    return transformSkillGraphToReactFlow(graphData);
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(transformed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(transformed.edges);

  // Update nodes when transformed data changes
  useMemo(() => {
    setNodes(transformed.nodes);
    setEdges(transformed.edges);
  }, [transformed, setNodes, setEdges]);

  const selectedNode = useMemo(() => {
    if (!conceptId || !graphData) return null;
    return graphData.nodes.find((n) => n.id === conceptId) as SkillNode | undefined;
  }, [conceptId, graphData]);

  const getMasteryColorClass = (mastery: number) => {
    if (mastery > 70) return 'text-green-600 dark:text-green-400';
    if (mastery >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">{t.common.error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t.common.retry}
        </Button>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
    <div className="relative h-[calc(100vh-8rem)]">
      {/* Legend */}
      <div className="absolute top-4 start-4 z-10 rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur">
        <p className="mb-2 text-xs font-semibold text-foreground">{t.skillGraph.legend}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">{t.skillGraph.highMastery}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">{t.skillGraph.mediumMastery}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">{t.skillGraph.lowMastery}</span>
          </div>
        </div>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        className="rounded-xl border bg-muted/20"
      >
        <Controls
          showInteractive={false}
          className="!border !rounded-lg !shadow-md"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>

      {/* Side Panel */}
      {selectedNode && selectedNode.type === 'concept' && (
        <div className="absolute top-0 end-0 z-20 h-full w-80 border-s bg-background shadow-xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t.skillGraph.conceptDetail}</h3>
            <Button variant="ghost" size="icon" onClick={() => setConceptId(null)}>
              <X className="size-4" />
            </Button>
          </div>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{selectedNode.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{t.skillGraph.mastery}</span>
                  <span className={`text-sm font-bold ${getMasteryColorClass(selectedNode.mastery ?? 0)}`}>
                    {selectedNode.mastery ?? 0}%
                  </span>
                </div>
                <Progress value={selectedNode.mastery ?? 0} className="h-2" />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.skillGraph.questions}</span>
                <span className="text-sm font-medium">{selectedNode.question_count ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.skillGraph.successRate}</span>
                <span className="text-sm font-medium">{selectedNode.success_rate ?? 0}%</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              setConceptId(null);
              navigate('practice');
            }}
          >
            <BookOpen className="size-4 me-2" />
            {t.skillGraph.practiceMore}
          </Button>
        </div>
      )}
    </div>
    </ReactFlowProvider>
  );
}