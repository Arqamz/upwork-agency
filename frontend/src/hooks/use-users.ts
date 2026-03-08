import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { User, PaginatedResponse } from '@/types';

interface FindUsersParams {
  page?: number;
  limit?: number;
}

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

export function useUsers(params: FindUsersParams = {}) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await api.get('/users', { params });
      return res.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      roleId: string;
      teamId?: string;
    }) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create user'));
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      roleId?: string;
      teamId?: string | null;
      password?: string;
      isActive?: boolean;
    }) => {
      const { id, ...rest } = data;
      const res = await api.patch(`/users/${id}`, rest);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update user'));
    },
  });
}
