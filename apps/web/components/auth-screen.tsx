"use client";

import { type UserListItemDto } from "@packages/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useSimpleLoginMutation, useSimpleRegisterMutation, useUsersQuery } from "@/lib/react-query/use-auth";
import { GuestOnly } from "@/components/route-guard";

type FormState = {
  name: string;
  phone: string;
};

function UserAvatar({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "50%",
        background: "var(--accent-soft)",
        color: "var(--accent-strong)",
        fontWeight: 700,
        fontSize: "0.95rem",
        flexShrink: 0,
      }}
    >
      {name.charAt(0)}
    </span>
  );
}

function UserListItem({
  user,
  disabled,
  onClick,
}: {
  user: UserListItemDto;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="sample-button"
      disabled={disabled}
      onClick={onClick}
      type="button"
      style={{ padding: "0.75rem 1rem" }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <UserAvatar name={user.name} />
        <span>
          <span className="sample-label">{user.name}</span>
          <span className="sample-value">{user.phone}</span>
        </span>
      </span>
      <span className="sample-value" style={{ fontSize: "1.2rem" }}>›</span>
    </button>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const usersQuery = useUsersQuery();
  const simpleLoginMutation = useSimpleLoginMutation();
  const simpleRegisterMutation = useSimpleRegisterMutation();
  const [showRegister, setShowRegister] = useState(false);
  const [formState, setFormState] = useState<FormState>({ name: "", phone: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const users = usersQuery.data ?? [];
  const isBusy = simpleLoginMutation.isPending || simpleRegisterMutation.isPending;

  const handleUserClick = (userId: number) => {
    setErrorMessage(null);
    simpleLoginMutation.mutate(userId, {
      onSuccess: () => {
        router.replace("/meetings");
      },
      onError: (error) => {
        setErrorMessage(extractApiErrorMessage(error, "로그인에 실패했습니다"));
      },
    });
  };

  const handleRegister = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setErrorMessage(null);

    simpleRegisterMutation.mutate(
      { name: formState.name.trim(), phone: formState.phone.trim() },
      {
        onSuccess: () => {
          router.replace("/meetings");
        },
        onError: (error) => {
          setErrorMessage(extractApiErrorMessage(error, "사용자 추가에 실패했습니다"));
        },
      }
    );
  };

  const handleAdminLogin = () => {
    // Find admin - it won't be in the user list (filtered to USER role)
    // Use simple-login with userId 1 (admin is always first seeded user)
    // Actually we need a different approach - let's login via the users list endpoint
    // The admin is not shown. We'll use a direct API call.
    setErrorMessage(null);
    simpleLoginMutation.mutate(1, {
      onSuccess: () => {
        router.replace("/admin/meetings");
      },
      onError: (error) => {
        setErrorMessage(extractApiErrorMessage(error, "관리자 로그인에 실패했습니다"));
      },
    });
  };

  return (
    <GuestOnly>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem 1rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "50%",
              background: "var(--accent-soft)",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontSize: "1.5rem", color: "var(--accent-strong)" }}>♡</span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            모임터
          </h1>
          <p className="meta-copy" style={{ marginTop: "0.35rem" }}>
            단톡방 모임 신청 및 선정 관리
          </p>
        </div>

        <section className="auth-card stack-lg" style={{ width: "min(100%, 28rem)", padding: "1.5rem" }}>
          {errorMessage ? <p className="status-banner">{errorMessage}</p> : null}

          {!showRegister ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-subtle)" }}>👤</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>사용자 선택</span>
              </div>

              {usersQuery.isLoading ? (
                <div className="stack-sm">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div className="loading-block" key={i} style={{ height: "3.5rem", borderRadius: "1rem" }} />
                  ))}
                </div>
              ) : (
                <div className="stack-sm">
                  {users.map((user) => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      disabled={isBusy}
                      onClick={() => handleUserClick(user.id)}
                    />
                  ))}
                </div>
              )}

              <button
                className="ghost-button"
                onClick={() => setShowRegister(true)}
                type="button"
                style={{ width: "100%" }}
              >
                + 새 사용자 추가
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>새 사용자 추가</span>
              </div>

              <form className="auth-form" onSubmit={handleRegister}>
                <label className="auth-field">
                  <span className="auth-label">이름</span>
                  <input
                    autoComplete="name"
                    className="auth-input"
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    placeholder="이름을 입력하세요"
                    required
                    type="text"
                    value={formState.name}
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">전화번호</span>
                  <input
                    autoComplete="tel"
                    className="auth-input"
                    onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    required
                    type="tel"
                    value={formState.phone}
                  />
                </label>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    className="ghost-button"
                    onClick={() => setShowRegister(false)}
                    type="button"
                    style={{ flex: 1 }}
                  >
                    돌아가기
                  </button>
                  <button
                    className="primary-button"
                    disabled={isBusy}
                    type="submit"
                    style={{ flex: 1 }}
                  >
                    {simpleRegisterMutation.isPending ? "추가 중..." : "추가하기"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        <button
          onClick={handleAdminLogin}
          disabled={isBusy}
          type="button"
          style={{
            marginTop: "1.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-subtle)",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          ⚙ 관리자 페이지로 이동
        </button>
      </main>
    </GuestOnly>
  );
}
