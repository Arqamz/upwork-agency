import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { Task, PaginatedResponse } from '@/types';

interface FindTasksParams {
  page?: number;
  limit?: number;
  projectId?: string;
  assigneeId?: string;
  status?: string;
}

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

export function useTasks(params: FindTasksParams = {}) {
  return useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      );
      const res = await api.get('/tasks', { params: filtered });
      return res.data;
    },
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await api.get(`/tasks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task> & { projectId: string; title: string }) => {
      const res = await api.post('/tasks', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create task'));
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: string }) => {
      const res = await api.patch(`/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update task'));
    },
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string }) => {
      const res = await api.post(`/tasks/${id}/assign`, { assigneeId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task assigned');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to assign task'));
    },
  });
}

export function useProjectTasks(projectId: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'by-project', projectId],
    queryFn: async () => {
      const res = await api.get(`/tasks/by-project/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useAllTasks(params: { assigneeId?: string; projectId?: string } = {}) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'all', params],
    queryFn: async () => {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      );
      const res = await api.get('/tasks/all', { params: filtered });
      return res.data;
    },
  });
}
