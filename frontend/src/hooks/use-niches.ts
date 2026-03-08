import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Niche } from '@/types';

export function useNiches(includeInactive = false) {
  return useQuery<Niche[]>({
    queryKey: ['niches', { includeInactive }],
    queryFn: async () => {
      const res = await api.get('/niches', {
        params: includeInactive ? { includeInactive: true } : {},
      });
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

export function useNicheClosers(nicheId: string) {
  return useQuery({
    queryKey: ['niches', nicheId, 'closers'],
    queryFn: async () => {
      const res = await api.get(`/niches/${nicheId}/closers`);
      return res.data;
    },
    enabled: !!nicheId,
  });
}

export function useCreateNiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const res = await api.post('/niches', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['niches'] });
      toast.success('Niche created');
    },
    onError: () => {
      toast.error('Failed to create niche');
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
    onError: () => {
      toast.error('Failed to update niche');
    },
  });
}

export function useAssignCloserToNiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nicheId, userId }: { nicheId: string; userId: string }) => {
      const res = await api.post(`/niches/${nicheId}/closers`, { userId });
      return res.data;
    },
    onSuccess: (_, { nicheId }) => {
      qc.invalidateQueries({ queryKey: ['niches', nicheId, 'closers'] });
      toast.success('Closer assigned to niche');
    },
    onError: () => {
      toast.error('Failed to assign closer');
    },
  });
}

export function useRemoveCloserFromNiche() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nicheId, userId }: { nicheId: string; userId: string }) => {
      const res = await api.delete(`/niches/${nicheId}/closers/${userId}`);
      return res.data;
    },
    onSuccess: (_, { nicheId }) => {
      qc.invalidateQueries({ queryKey: ['niches', nicheId, 'closers'] });
      toast.success('Closer removed from niche');
    },
    onError: () => {
      toast.error('Failed to remove closer');
    },
  });
}
