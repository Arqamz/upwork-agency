import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Script, PaginatedResponse } from '@/types';

interface FindScriptsParams {
  page?: number;
  limit?: number;
}

export function useScripts(params: FindScriptsParams = {}) {
  return useQuery<PaginatedResponse<Script>>({
    queryKey: ['scripts', params],
    queryFn: async () => {
      const res = await api.get('/scripts', { params });
      return res.data;
    },
  });
}

export function useScript(id: string) {
  return useQuery<Script>({
    queryKey: ['scripts', id],
    queryFn: async () => {
      const res = await api.get(`/scripts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category?: string;
      content: string;
      nicheId?: string;
    }) => {
      const res = await api.post('/scripts', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scripts'] });
      toast.success('Script created');
    },
    onError: () => {
      toast.error('Failed to create script');
    },
  });
}

export function useCreateScriptVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scriptId, content }: { scriptId: string; content: string }) => {
      const res = await api.post(`/scripts/${scriptId}/version`, { content });
      return res.data;
    },
    onSuccess: (_, { scriptId }) => {
      qc.invalidateQueries({ queryKey: ['scripts', scriptId] });
      qc.invalidateQueries({ queryKey: ['scripts'] });
      toast.success('Script version created');
    },
    onError: () => {
      toast.error('Failed to create script version');
    },
  });
}
