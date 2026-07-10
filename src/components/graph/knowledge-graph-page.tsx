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
  useReactFlow,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getKnowledgeGraphApi } from '@/features/knowledge-graph/api';
import { transformSkillGraphToReactFlow } from '@/features/knowledge-graph/transform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { X, BookOpen, User, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { useUIStore } from '@/stores';
import { create } from 'zustand';
import type { SkillNode, SkillGraphData } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MasteryFilter = 'all' | 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// Local stores
// ---------------------------------------------------------------------------

const useDetailStore = create<{
  conceptId: string | null;
  setConceptId: (id: string | null) => void;
}>((set) => ({ conceptId: null, setConceptId: (id) => set({ conceptId: id }) }));

const useUserSummaryStore = create<{
  visible: boolean;
  setVisible: (v: boolean) => void;
}>((set) => ({ visible: false, setVisible: (v) => set({ visible: v }) }));

// ---------------------------------------------------------------------------
// Typed node data interfaces
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mastery filter helper
// ---------------------------------------------------------------------------

function matchesMasteryFilter(mastery: number, filter: MasteryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'low') return mastery <= 33;
  if (filter === 'medium') return mastery > 33 && mastery <= 66;
  if (filter === 'high') return mastery > 66;
  return true;
}

/**
 * Filters the full graph data by workspace and/or mastery level.
 * - Workspace filter: keep only user, the selected workspace, and its concepts.
 * - Mastery filter: keep only concept nodes that match; hide workspace nodes
 *   that have zero matching concepts underneath them.
 */
function applyFilters(
  data: SkillGraphData,
  workspaceId: string | null,
  masteryFilter: MasteryFilter
): SkillGraphData {
  let nodes = [...data.nodes];
  let edges = [...data.edges];

  // --- Workspace filter ---
  if (workspaceId) {
    // Keep: user node, the selected workspace node, all concept nodes that are
    // children of that workspace.
    const allowedConceptIds = new Set(
      edges
        .filter((e) => e.source === workspaceId)
        .map((e) => e.target)
    );
    nodes = nodes.filter(
      (n) => n.id === 'user' || n.id === workspaceId || allowedConceptIds.has(n.id)
    );
    edges = edges.filter(
      (e) =>
        (e.source === 'user' && e.target === workspaceId) ||
        (e.source === workspaceId && allowedConceptIds.has(e.target))
    );
  }

  // --- Mastery filter ---
  if (masteryFilter !== 'all') {
    // Only keep concept nodes whose mastery matches the filter
    const filteredConceptIds = new Set(
      nodes
        .filter(
          (n) =>
            n.type === 'concept' &&
            matchesMasteryFilter(n.mastery ?? 0, masteryFilter)
        )
        .map((n) => n.id)
    );

    // Determine which workspace nodes have at least one matching concept
    const workspacesWithMatchingConcepts = new Set<string>();
    edges.forEach((e) => {
      if (filteredConceptIds.has(e.target)) {
        workspacesWithMatchingConcepts.add(e.source);
      }
    });

    // Keep: user, workspaces that have matching concepts, and matching concepts
    nodes = nodes.filter(
      (n) =>
        n.type === 'user' ||
        (n.type === 'workspace' && workspacesWithMatchingConcepts.has(n.id)) ||
        (n.type === 'concept' && filteredConceptIds.has(n.id))
    );

    const keepNodeIds = new Set(nodes.map((n) => n.id));
    edges = edges.filter(
      (e) => keepNodeIds.has(e.source) && keepNodeIds.has(e.target)
    );
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Custom node: User (central circle)
// ---------------------------------------------------------------------------

function UserNode({ data }: { data: UserNodeData }) {
  const setVisible = useUserSummaryStore((s) => s.setVisible);

  return (
    <>
      <Handle type="source" position={Position.Top} className="!bg-emerald-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2 !h-2" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
        className="group flex size-12 items-center justify-center rounded-full bg-emerald-600 shadow-lg ring-4 ring-emerald-600/20 transition-all hover:scale-110 hover:ring-emerald-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label={data.label}
      >
        <User className="size-6 text-white" />
      </button>

      <p className="mt-1 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
        {data.label}
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Custom node: Workspace
// ---------------------------------------------------------------------------

function WorkspaceNode({ data }: { data: WorkspaceNodeData }) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2 !h-2" />

      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-3 shadow-md transition-transform hover:scale-105 dark:border-emerald-600 dark:bg-emerald-950/50">
        <span className="whitespace-nowrap text-center text-sm font-bold text-emerald-800 dark:text-emerald-200">
          {data.label}
        </span>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Custom node: Concept
// ---------------------------------------------------------------------------

function ConceptNode({ data, id }: { data: ConceptNodeData; id: string }) {
  const setDetailId = useDetailStore((s) => s.setConceptId);

  const mastery = data.mastery ?? 0;
  const color = data.color || '#eab308';
  const borderColor = data.borderColor || '#ca8a04';

  return (
    <div className="cursor-pointer" onClick={() => setDetailId(id)}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />

      <div
        className="rounded-full border-2 p-3 shadow-sm transition-transform hover:scale-110"
        style={{ borderColor, backgroundColor: `${color}15` }}
      >
        <div
          className="flex size-10 items-center justify-center rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {Math.round(mastery)}%
        </div>
      </div>

      <p className="mt-1 max-w-[80px] truncate text-center text-[10px] font-medium text-foreground">
        {data.label}
      </p>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node type registry
// ---------------------------------------------------------------------------

const nodeTypes: Record<string, React.ComponentType<{ data: unknown; id: string }>> = {
  userNode: UserNode,
  workspaceNode: WorkspaceNode,
  conceptNode: ConceptNode,
};

// ---------------------------------------------------------------------------
// Inner graph component
// ---------------------------------------------------------------------------

function KnowledgeGraphInner() {
  const t = useTranslation();
  const navigate = useUIStore((s) => s.navigate);

  const conceptId = useDetailStore((s) => s.conceptId);
  const setConceptId = useDetailStore((s) => s.setConceptId);
  const userSummaryVisible = useUserSummaryStore((s) => s.visible);
  const setUserSummaryVisible = useUserSummaryStore((s) => s.setVisible);

  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');

  // Always fetch the full unfiltered graph; filtering happens client-side.
  const {
    data: rawGraphData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['knowledge-graph-full'],
    queryFn: () => getKnowledgeGraphApi(),
    staleTime: 5 * 60 * 1000,
  });

  // List of workspace nodes for the dropdown (from unfiltered data)
  const workspaceNodes = useMemo(() => {
    if (!rawGraphData) return [];
    return rawGraphData.nodes.filter((n) => n.type === 'workspace');
  }, [rawGraphData]);

  // Apply both filters client-side
  const filteredGraphData = useMemo(() => {
    if (!rawGraphData) return rawGraphData;
    return applyFilters(rawGraphData, selectedWorkspace, masteryFilter);
  }, [rawGraphData, selectedWorkspace, masteryFilter]);

  const transformed = useMemo(() => {
    if (!filteredGraphData) return { nodes: [], edges: [] };
    return transformSkillGraphToReactFlow(filteredGraphData);
  }, [filteredGraphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(transformed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(transformed.edges);

  // Sync transformed data into React Flow state when filters change
  useMemo(() => {
    setNodes(transformed.nodes);
    setEdges(transformed.edges);
  }, [transformed, setNodes, setEdges]);

  const selectedNode = useMemo(() => {
    if (!conceptId || !rawGraphData) return null;
    return rawGraphData.nodes.find((n) => n.id === conceptId) as SkillNode | undefined;
  }, [conceptId, rawGraphData]);

  const conceptCount = useMemo(
    () => filteredGraphData?.nodes.filter((n) => n.type === 'concept').length ?? 0,
    [filteredGraphData],
  );
  const workspaceCount = useMemo(
    () => filteredGraphData?.nodes.filter((n) => n.type === 'workspace').length ?? 0,
    [filteredGraphData],
  );

  const getMasteryColorClass = (mastery: number) => {
    if (mastery > 66) return 'text-green-600 dark:text-green-400';
    if (mastery > 33) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const onNodeClick = useCallback(() => {
    setUserSummaryVisible(false);
  }, [setUserSummaryVisible]);

  const onPaneClick = useCallback(() => {
    setUserSummaryVisible(false);
    setConceptId(null);
  }, [setUserSummaryVisible, setConceptId]);

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
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            {t.knowledgeGraph.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.knowledgeGraph.description}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 shrink-0 text-muted-foreground" />

          {/* Workspace filter */}
          <Select
            value={selectedWorkspace ?? '__all__'}
            onValueChange={(v) => {
              setSelectedWorkspace(v === '__all__' ? null : v);
              setConceptId(null);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t.knowledgeGraph.filterAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t.knowledgeGraph.filterAll}</SelectItem>
              {workspaceNodes.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mastery filter */}
          <Select
            value={masteryFilter}
            onValueChange={(v) => {
              setMasteryFilter(v as MasteryFilter);
              setConceptId(null);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t.knowledgeGraph.masteryFilter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.knowledgeGraph.masteryAll}</SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-500 shrink-0" />
                  {t.knowledgeGraph.masteryLow}
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-yellow-500 shrink-0" />
                  {t.knowledgeGraph.masteryMedium}
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-green-500 shrink-0" />
                  {t.knowledgeGraph.masteryHigh}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Graph area */}
      <div className="relative h-[calc(100vh-13rem)] min-h-[400px]">
        {/* Legend */}
        <div className="absolute start-4 top-4 z-10 rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-foreground">
            {t.knowledgeGraph.legend}
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-emerald-600" />
              <span className="text-xs text-muted-foreground">{t.knowledgeGraph.workspace}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">{t.knowledgeGraph.highMastery}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-muted-foreground">{t.knowledgeGraph.mediumMastery}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">{t.knowledgeGraph.lowMastery}</span>
            </div>
          </div>
        </div>

        {/* Custom zoom controls */}
        <ZoomControls />

        {/* User summary popover */}
        {userSummaryVisible && (
          <UserSummaryPopover
            workspaceCount={workspaceCount}
            conceptCount={conceptCount}
          />
        )}

        {/* Empty state when all nodes are filtered out */}
        {nodes.filter((n) => n.type !== 'userNode').length === 0 && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border bg-muted/20">
            <p className="text-sm font-medium text-muted-foreground">
              No concepts match the selected filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedWorkspace(null);
                setMasteryFilter('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={2}
          className="rounded-xl border bg-muted/20"
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} className="!rounded-lg !border !shadow-md" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>

        {/* Concept detail side panel */}
        {selectedNode && selectedNode.type === 'concept' && (
          <div className="absolute end-0 top-0 z-20 h-full w-80 overflow-y-auto border-s bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.knowledgeGraph.conceptDetail}</h3>
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
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t.knowledgeGraph.mastery}</span>
                    <span className={`text-sm font-bold ${getMasteryColorClass(selectedNode.mastery ?? 0)}`}>
                      {selectedNode.mastery ?? 0}%
                    </span>
                  </div>
                  <Progress value={selectedNode.mastery ?? 0} className="h-2" />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.knowledgeGraph.questions}</span>
                  <span className="text-sm font-medium">{selectedNode.question_count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.knowledgeGraph.successRate}</span>
                  <span className="text-sm font-medium">{selectedNode.success_rate ?? 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => {
                setConceptId(null);
                navigate('practice');
              }}
            >
              <BookOpen className="me-2 size-4" />
              {t.knowledgeGraph.practiceMore}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zoom controls
// ---------------------------------------------------------------------------

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const t = useTranslation();

  return (
    <div className="absolute end-4 top-4 z-10 flex flex-col gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => zoomIn()}
        aria-label={t.knowledgeGraph.zoomIn}
      >
        <ZoomIn className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => zoomOut()}
        aria-label={t.knowledgeGraph.zoomOut}
      >
        <ZoomOut className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => fitView({ padding: 0.25 })}
        aria-label={t.knowledgeGraph.fitView}
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User summary popover
// ---------------------------------------------------------------------------

function UserSummaryPopover({
  workspaceCount,
  conceptCount,
}: {
  workspaceCount: number;
  conceptCount: number;
}) {
  const t = useTranslation();
  const setVisible = useUserSummaryStore((s) => s.setVisible);

  const summaryText = t.knowledgeGraph.userSummary
    .replace('{count}', String(workspaceCount))
    .replace('{concepts}', String(conceptCount));

  return (
    <div className="absolute start-1/2 top-1/2 z-30 w-72 -translate-x-1/2 -translate-y-[140%]">
      <div className="rounded-lg border bg-popover p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600">
              <User className="size-4 text-white" />
            </div>
            <span className="text-sm font-semibold">{t.knowledgeGraph.workspace}</span>
          </div>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => setVisible(false)}>
            <X className="size-3" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{summaryText}</p>
      </div>
      <div className="mx-auto -mt-px h-3 w-3 rotate-45 border-b border-e border-border bg-popover" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function KnowledgeGraphPage() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner />
    </ReactFlowProvider>
  );
}
