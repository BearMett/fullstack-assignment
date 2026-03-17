"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";

export function SiteNavbar() {
  const pathname = usePathname();
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

  if (!hasHydrated || !session) {
    return null;
  }

  const isMeetingsPath = pathname.startsWith("/meetings");
  const isMyApplicationsPath = pathname.startsWith("/my-applications");

  return (
    <header className="app-nav">
      <div className="nav-card">
        <Link
          className="brand-lockup"
          href="/meetings"
          style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "50%",
              background: "var(--accent-soft)",
              color: "var(--accent-strong)",
              fontSize: "0.85rem",
            }}
          >
            ♡
          </span>
          <span className="brand-title" style={{ fontSize: "1.05rem" }}>
            모임터
          </span>
        </Link>

        <div className="nav-actions">
          <Link
            className={`nav-link ${isMeetingsPath ? "is-active" : ""}`}
            href="/meetings"
            style={{ gap: "0.35rem" }}
          >
            🏠 모임 목록
          </Link>
          <Link
            className={`nav-link ${isMyApplicationsPath ? "is-active" : ""}`}
            href="/my-applications"
            style={{ gap: "0.35rem" }}
          >
            📋 내 신청
          </Link>
          <span className="nav-chip">
            <span>👤</span>
            <strong>{session.user.name}</strong>
          </span>
          <button
            className="ghost-button"
            onClick={handleLogout}
            type="button"
            style={{ minHeight: "2.5rem", padding: "0 0.75rem" }}
          >
            ⏎
          </button>
        </div>
      </div>
    </header>
  );
}
