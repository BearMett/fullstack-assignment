"use client";

import { type AuthTokenDto } from "@packages/shared";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { clearAuthToken, setAuthToken } from "@/lib/api-client";

type AuthState = {
  session: AuthTokenDto | null;
  hasHydrated: boolean;
  setSession: (session: AuthTokenDto) => void;
  clearSession: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const authStorage = createJSONStorage<Pick<AuthState, "session">>(() => {
  if (typeof window === "undefined") {
    return noopStorage;
  }

  return window.localStorage;
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hasHydrated: false,
      setSession: (session) => {
        setAuthToken(session.token);
        set({ session });
      },
      clearSession: () => {
        clearAuthToken();
        set({ session: null });
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: "sangsang-auth-session",
      storage: authStorage,
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        const session = state?.session ?? null;

        if (session?.token) {
          setAuthToken(session.token);
        } else {
          clearAuthToken();
        }

        state?.setHasHydrated(true);
      },
    }
  )
);
