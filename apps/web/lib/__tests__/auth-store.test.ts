import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the api-client module before importing the store
vi.mock("@/lib/api-client", () => ({
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

import { useAuthStore } from "../store/auth-store";
import { setAuthToken, clearAuthToken } from "@/lib/api-client";
import { type AuthTokenDto, UserRole } from "@packages/shared";

const mockSession: AuthTokenDto = {
  token: "test-jwt-token-123",
  user: {
    id: 1,
    email: "test@example.com",
    name: "테스트 사용자",
    role: UserRole.USER,
  },
};

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({
      session: null,
      hasHydrated: false,
    });
    vi.clearAllMocks();
  });

  it("초기 상태는 session이 null이다", () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
  });

  it("setSession으로 세션을 설정하면 API 토큰도 설정된다", () => {
    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(setAuthToken).toHaveBeenCalledWith("test-jwt-token-123");
  });

  it("clearSession으로 세션을 지우면 API 토큰도 제거된다", () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(clearAuthToken).toHaveBeenCalled();
  });

  it("setHasHydrated로 hydration 상태를 설정할 수 있다", () => {
    useAuthStore.getState().setHasHydrated(true);
    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });

  it("setSession → clearSession → setSession 연속 호출이 올바르게 동작한다", () => {
    const { setSession, clearSession } = useAuthStore.getState();

    setSession(mockSession);
    expect(useAuthStore.getState().session).toEqual(mockSession);

    clearSession();
    expect(useAuthStore.getState().session).toBeNull();

    const newSession: AuthTokenDto = {
      token: "new-token-456",
      user: { id: 2, email: "other@example.com", name: "다른 사용자", role: UserRole.ADMIN },
    };
    setSession(newSession);
    expect(useAuthStore.getState().session).toEqual(newSession);
    expect(setAuthToken).toHaveBeenLastCalledWith("new-token-456");
  });
});
