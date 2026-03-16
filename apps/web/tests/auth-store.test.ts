import { UserRole, type AuthTokenDto } from "@packages/shared";
import { describe, expect, it } from "vitest";
import { getAuthToken } from "../lib/api-client";
import { useAuthStore } from "../lib/store";

const mockSession: AuthTokenDto = {
  token: "session-token",
  user: {
    id: 7,
    email: "user@example.com",
    name: "기본 회원",
    role: UserRole.USER,
  },
};

function resetStore() {
  useAuthStore.getState().clearSession();
  useAuthStore.getState().setHasHydrated(true);
}

describe("auth store", () => {
  it("saves session and mirrors token in api client", () => {
    resetStore();

    useAuthStore.getState().setSession(mockSession);

    expect(useAuthStore.getState().session).toEqual(mockSession);
    expect(getAuthToken()).toBe(mockSession.token);
  });

  it("clears session and token together", () => {
    resetStore();
    useAuthStore.getState().setSession(mockSession);

    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().session).toBeNull();
    expect(getAuthToken()).toBeNull();
  });
});
