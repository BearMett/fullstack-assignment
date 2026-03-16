"use client";

import { type AuthTokenDto, type SignInDto, type SignUpDto } from "@packages/shared";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
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
