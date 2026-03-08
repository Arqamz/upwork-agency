import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Deal, PaginatedResponse } from '@/types';

interface FindDealsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function useDeals(params: FindDealsParams = {}) {
  return useQuery<PaginatedResponse<Deal>>({
    queryKey: ['deals', params],
    queryFn: async () => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      );
      const res = await api.get('/deals', { params: filtered });
      return res.data;
    },
  });
}

export function useDeal(id: string) {
  return useQuery<Deal>({
    queryKey: ['deals', id],
    queryFn: async () => {
      const res = await api.get(`/deals/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useDealStats() {
  return useQuery({
    queryKey: ['deals', 'stats'],
    queryFn: async () => {
      const res = await api.get('/deals/stats');
      return res.data;
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Deal>) => {
      const res = await api.post('/deals', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
    },
    onError: () => {
      toast.error('Failed to create deal');
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deal> & { id: string }) => {
      const res = await api.patch(`/deals/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
    },
    onError: () => {
      toast.error('Failed to update deal');
    },
  });
}

export function useCloseDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await api.post(`/deals/${id}/close`, { status, notes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal closed');
    },
    onError: () => {
      toast.error('Failed to close deal');
    },
  });
}
