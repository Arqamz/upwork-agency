import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { Niche } from '@/types';

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

export function useNiches(organizationId?: string, includeInactive = false) {
  return useQuery<Niche[]>({
    queryKey: ['niches', { organizationId, includeInactive }],
    queryFn: async () => {
      const params: Record<string, string | boolean> = {};
      if (organizationId) params.organizationId = organizationId;
      if (includeInactive) params.includeInactive = true;
      const res = await api.get('/niches', { params });
      return res.data;
    },
  });
}

export function useNiche(id: string) {
  return useQuery<Niche>({
    queryKey: ['niches', id],
    queryFn: async () => {
      const res = await api.get(`/niches/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateNiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      description?: string;
      organizationId?: string;
    }) => {
      const res = await api.post('/niches', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['niches'] });
      toast.success('Niche created');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create niche'));
    },
  });
}

export function useUpdateNiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string }) => {
      const res = await api.patch(`/niches/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['niches'] });
      toast.success('Niche updated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update niche'));
    },
  });
}
