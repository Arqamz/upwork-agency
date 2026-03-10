import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { VideoProposal, PaginatedResponse } from '@/types';

interface CreateVideoProposalInput {
  projectId: string;
  videoUrl: string;
  storageKey: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

export function useVideoProposals(page = 1, limit = 20, projectId?: string) {
  return useQuery<PaginatedResponse<VideoProposal>>({
    queryKey: ['videos', page, limit, projectId],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (projectId) params.projectId = projectId;
      const res = await api.get('/videos', { params });
      return res.data;
    },
  });
}

export function useVideoProposal(id: string) {
  return useQuery<VideoProposal>({
    queryKey: ['videos', id],
    queryFn: async () => {
      const res = await api.get(`/videos/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useVideoByProject(projectId: string) {
  return useQuery<VideoProposal>({
    queryKey: ['videos', 'project', projectId],
    queryFn: async () => {
      const res = await api.get(`/videos/project/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateVideoProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVideoProposalInput) => {
      const res = await api.post('/videos', data);
      return res.data as VideoProposal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video proposal created');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create video proposal'));
    },
  });
}

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: async (fileName: string) => {
      const res = await api.post('/videos/upload-url', { fileName });
      return res.data as { storageKey: string; uploadUrl: string };
    },
    onSuccess: () => {
      toast.success('Upload URL generated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to generate upload URL'));
    },
  });
}

export function useIncrementViewCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/videos/${id}/view`);
      return res.data as VideoProposal;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['videos', id] });
      qc.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideoProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/videos/${id}`);
      return res.data as VideoProposal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video proposal deleted');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to delete video proposal'));
    },
  });
}
