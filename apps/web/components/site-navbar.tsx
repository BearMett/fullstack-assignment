"use client";

import { UserRole } from "@packages/shared";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";

const roleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]: "관리자",
  [UserRole.USER]: "회원",
};

export function SiteNavbar() {
  const pathname = usePathname();
  const isMeetingsPath = pathname.startsWith("/meetings");
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().clearSession();
      router.replace("/login");
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <header className="app-nav">
      <div className="nav-card">
        <Link className="brand-lockup" href={session ? "/meetings" : "/login"}>
          <span className="brand-kicker">Sangsangdan</span>
          <span className="brand-title">모임 신청 보드</span>
        </Link>

        <div className="nav-actions">
          {hasHydrated ? (
            session ? (
              <>
                <Link className={`nav-link ${isMeetingsPath ? "is-active" : ""}`} href="/meetings">
                  모임
                </Link>
                <span className="nav-chip">
                  <strong>{session.user.name}</strong>
                  <span>
                    {session.user.email} · {roleLabel[session.user.role]}
                  </span>
                </span>
                <button className="ghost-button" onClick={handleLogout} type="button">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link className={`nav-link ${pathname === "/login" ? "is-active" : ""}`} href="/login">
                  로그인
                </Link>
                <Link className={`nav-link ${pathname === "/register" ? "is-active" : ""}`} href="/register">
                  회원가입
                </Link>
              </>
            )
          ) : (
            <span className="nav-chip">세션을 불러오는 중입니다</span>
          )}
        </div>
      </div>
    </header>
  );
}
