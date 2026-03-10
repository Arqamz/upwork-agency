import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import type { Organization, UserOrganization } from '@/types';

function extractError(error: unknown, fallback: string): string {
  const msg = (error as AxiosError<{ message: string | string[] }>)?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

export function useOrganizations(includeInactive = false) {
  return useQuery<Organization[]>({
    queryKey: ['organizations', { includeInactive }],
    queryFn: async () => {
      const res = await api.get('/organizations', {
        params: includeInactive ? { includeInactive: true } : {},
      });
      return res.data;
    },
  });
}

export function useOrganization(id: string) {
  return useQuery<Organization>({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const res = await api.get(`/organizations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useMyOrganizations() {
  return useQuery<UserOrganization[]>({
    queryKey: ['organizations', 'my'],
    queryFn: async () => {
      const res = await api.get('/organizations/my');
      return res.data;
    },
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery<UserOrganization[]>({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: async () => {
      const res = await api.get(`/organizations/${orgId}/members`);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const res = await api.post('/organizations', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to create organization'));
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    }) => {
      const res = await api.patch(`/organizations/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization updated');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to update organization'));
    },
  });
}

export function useAddOrgMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      const res = await api.post(`/organizations/${orgId}/members`, { userId });
      return res.data;
    },
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
      qc.invalidateQueries({ queryKey: ['organizations', orgId] });
      toast.success('Member added to organization');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to add member'));
    },
  });
}

export function useRemoveOrgMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      const res = await api.delete(`/organizations/${orgId}/members/${userId}`);
      return res.data;
    },
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
      qc.invalidateQueries({ queryKey: ['organizations', orgId] });
      toast.success('Member removed from organization');
    },
    onError: (error: unknown) => {
      toast.error(extractError(error, 'Failed to remove member'));
    },
  });
}
