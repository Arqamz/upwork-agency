import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { AxiosError } from 'axios';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => api.patch('/auth/profile', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to update profile');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) =>
      api.patch('/auth/change-password', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to change password');
    },
  });
}
