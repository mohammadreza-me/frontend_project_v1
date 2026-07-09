import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspacesApi,
  createWorkspaceApi,
  getWorkspaceStatsApi,
  getWorkspaceCoverageApi,
  getWorkspaceTagsApi,
  getConceptTreeApi,
  getConceptHistoryApi,
  toggleWorkspaceStatusApi,
} from './api';
import type { CreateWorkspaceRequest } from '@/types';

export function useWorkspaces() {
  return useQuery({ queryKey: ['workspaces'], queryFn: getWorkspacesApi });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceRequest) => createWorkspaceApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useToggleWorkspaceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => toggleWorkspaceStatusApi(workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useWorkspaceStats(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace-stats', workspaceId],
    queryFn: () => getWorkspaceStatsApi(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useWorkspaceCoverage(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace-coverage', workspaceId],
    queryFn: () => getWorkspaceCoverageApi(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useWorkspaceTags(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace-tags', workspaceId],
    queryFn: () => getWorkspaceTagsApi(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useConceptTree(workspaceId: string | null) {
  return useQuery({
    queryKey: ['concept-tree', workspaceId],
    queryFn: () => getConceptTreeApi(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useConceptHistory(conceptName: string | null) {
  return useQuery({
    queryKey: ['concept-history', conceptName],
    queryFn: () => getConceptHistoryApi(conceptName!),
    enabled: !!conceptName,
  });
}