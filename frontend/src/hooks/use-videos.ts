import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { VideoProposal, PaginatedResponse } from '@/types';

interface CreateVideoProposalInput {
  proposalId: string;
  videoUrl: string;
  storageKey: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export function useVideoProposals(page = 1, limit = 20) {
  return useQuery<PaginatedResponse<VideoProposal>>({
    queryKey: ['videos', page, limit],
    queryFn: async () => {
      const res = await api.get('/videos', { params: { page, limit } });
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

export function useVideoByProposal(proposalId: string) {
  return useQuery<VideoProposal>({
    queryKey: ['videos', 'proposal', proposalId],
    queryFn: async () => {
      const res = await api.get(`/videos/proposal/${proposalId}`);
      return res.data;
    },
    enabled: !!proposalId,
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
    onError: () => {
      toast.error('Failed to create video proposal');
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
    onError: () => {
      toast.error('Failed to generate upload URL');
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
    onError: () => {
      toast.error('Failed to delete video proposal');
    },
  });
}
