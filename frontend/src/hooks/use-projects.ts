import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Project, PaginatedResponse } from '@/types';

interface FindProjectsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function useProjects(params: FindProjectsParams = {}) {
  return useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      );
      const res = await api.get('/projects', { params: filtered });
      return res.data;
    },
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await api.post('/projects', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const res = await api.patch(`/projects/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
    onError: () => {
      toast.error('Failed to update project');
    },
  });
}

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'milestones'],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/milestones`);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      ...data
    }: {
      projectId: string;
      name: string;
      dueDate?: string;
      amount?: number;
    }) => {
      const res = await api.post(`/projects/${projectId}/milestones`, data);
      return res.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
      toast.success('Milestone created');
    },
    onError: () => {
      toast.error('Failed to create milestone');
    },
  });
}

export function useCompleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, id }: { projectId: string; id: string }) => {
      const res = await api.post(`/projects/${projectId}/milestones/${id}/complete`);
      return res.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
      toast.success('Milestone completed');
    },
    onError: () => {
      toast.error('Failed to complete milestone');
    },
  });
}
