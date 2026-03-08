import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Meeting, PaginatedResponse } from '@/types';

interface FindMeetingsParams {
  page?: number;
  limit?: number;
  closerId?: string;
  status?: string;
}

export function useMeetings(params: FindMeetingsParams = {}) {
  return useQuery<PaginatedResponse<Meeting>>({
    queryKey: ['meetings', params],
    queryFn: async () => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      );
      const res = await api.get('/meetings', { params: filtered });
      return res.data;
    },
  });
}

export function useMeeting(id: string) {
  return useQuery<Meeting>({
    queryKey: ['meetings', id],
    queryFn: async () => {
      const res = await api.get(`/meetings/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const res = await api.post('/meetings', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting scheduled');
    },
    onError: () => {
      toast.error('Failed to schedule meeting');
    },
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Meeting> & { id: string }) => {
      const res = await api.patch(`/meetings/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting updated');
    },
    onError: () => {
      toast.error('Failed to update meeting');
    },
  });
}

export function useCompleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; notes?: string; duration?: number }) => {
      const res = await api.post(`/meetings/${id}/complete`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting completed');
    },
    onError: () => {
      toast.error('Failed to complete meeting');
    },
  });
}
