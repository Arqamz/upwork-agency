import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Client, PaginatedResponse } from '@/types';

interface FindClientsParams {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
}

export function useClients(params: FindClientsParams = {}) {
  return useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', params],
    queryFn: async () => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      );
      const res = await api.get('/clients', { params: filtered });
      return res.data;
    },
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const res = await api.post('/clients', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created');
    },
    onError: () => {
      toast.error('Failed to create client');
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const res = await api.patch(`/clients/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated');
    },
    onError: () => {
      toast.error('Failed to update client');
    },
  });
}
