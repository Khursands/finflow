'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getMe().then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return { user: data?.user ?? null, isLoading };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout().then((r) => r.data),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
    onError: () => {
      toast.error('Failed to logout');
    },
  });
}
