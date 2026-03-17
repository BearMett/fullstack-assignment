"use client";

import { type AuthTokenDto, type SignInDto, type SignUpDto, type UserListItemDto } from "@packages/shared";
import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import { authApiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";

export function useRegisterMutation(): UseMutationResult<AuthTokenDto, unknown, SignUpDto> {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload) => authApiClient.register(payload),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useLoginMutation(): UseMutationResult<AuthTokenDto, unknown, SignInDto> {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload) => authApiClient.login(payload),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useUsersQuery(): UseQueryResult<UserListItemDto[]> {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => authApiClient.listUsers(),
  });
}

export function useSimpleLoginMutation(): UseMutationResult<AuthTokenDto, unknown, number> {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (userId) => authApiClient.simpleLogin(userId),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useSimpleRegisterMutation(): UseMutationResult<AuthTokenDto, unknown, { name: string; phone: string }> {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: ({ name, phone }) => authApiClient.simpleRegister(name, phone),
    onSuccess: (session) => {
      setSession(session);
    },
  });
}
