import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { Project, PaginatedResponse, PipelineCount, ReviewStatus } from '@/types';

interface FindProjectsParams {
  page?: number;
  limit?: number;
  stage?: string;
  excludeStages?: string;
  organizationId?: string;
  assignedCloserId?: string;
  assignedPMId?: string;
  discoveredById?: string;
  nicheId?: string;
  teamId?: string;
}

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
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

export function usePipelineCounts(organizationId?: string) {
  return useQuery<PipelineCount[]>({
    queryKey: ['projects', 'pipeline', organizationId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (organizationId) params.organizationId = organizationId;
      const res = await api.get('/projects/pipeline', { params });
      return res.data;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      pricingType: string;
      organizationId: string;
      jobUrl?: string;
      jobDescription?: string;
      hourlyRateMin?: number;
      hourlyRateMax?: number;
      fixedPrice?: number;
      nicheId?: string;
      teamId?: string;
      discoveredById?: string;
      assignedCloserId?: string;
    }) => {
      const res = await api.post('/projects', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create project'));
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
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update project'));
    },
  });
}

export function useAdvanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/projects/${id}/advance`);
      return res.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['projects'] });
      const snapshots = qc.getQueriesData<PaginatedResponse<Project>>({
        queryKey: ['projects'],
      });
      return { snapshots };
    },
    onError: (error: unknown, _id, ctx) => {
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      toast.error(extractError(error, 'Failed to advance stage'));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Stage advanced');
    },
  });
}

export function useSetStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await api.patch(`/projects/${id}/stage`, { stage });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Stage updated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update stage'));
    },
  });
}

export function useAssignProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      assignedCloserId?: string;
      assignedPMId?: string;
      lastEditedById?: string;
    }) => {
      const res = await api.patch(`/projects/${id}/assign`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project assignment updated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to assign project'));
    },
  });
}

export function useReviewProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status: ReviewStatus;
      comments?: string;
      reviewedById?: string;
    }) => {
      const res = await api.post(`/projects/${id}/review`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Review submitted');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to submit review'));
    },
  });
}

export function useMilestones(projectId: string) {
  return useQuery<import('@/types').Milestone[]>({
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
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create milestone'));
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
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to complete milestone'));
    },
  });
}
