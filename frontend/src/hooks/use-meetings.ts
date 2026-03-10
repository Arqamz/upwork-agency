import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { Meeting, MeetingType, PaginatedResponse } from '@/types';

interface FindMeetingsParams {
  page?: number;
  limit?: number;
  closerId?: string;
  projectId?: string;
  status?: string;
}

interface CreateMeetingInput {
  projectId: string;
  closerId?: string;
  type?: MeetingType;
  scheduledAt: string;
  notes?: string;
  meetingUrl?: string;
  fathomUrl?: string;
  loomUrl?: string;
  driveUrl?: string;
}

interface CompleteMeetingInput {
  id: string;
  notes?: string;
  fathomUrl?: string;
  loomUrl?: string;
  driveUrl?: string;
}

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
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
    mutationFn: async (data: CreateMeetingInput) => {
      const res = await api.post('/meetings', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting scheduled');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to schedule meeting'));
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
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update meeting'));
    },
  });
}

export function useCompleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: CompleteMeetingInput) => {
      const res = await api.post(`/meetings/${id}/complete`, data);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['meetings'] });
      const snapshots = qc.getQueriesData<PaginatedResponse<Meeting>>({ queryKey: ['meetings'] });
      qc.setQueriesData<PaginatedResponse<Meeting>>({ queryKey: ['meetings'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m) =>
            m.id === id ? { ...m, status: 'COMPLETED' as Meeting['status'] } : m,
          ),
        };
      });
      return { snapshots };
    },
    onError: (error: unknown, _vars, ctx) => {
      if (ctx?.snapshots) {
        ctx.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      toast.error(extractError(error, 'Failed to complete meeting'));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting completed');
    },
  });
}
