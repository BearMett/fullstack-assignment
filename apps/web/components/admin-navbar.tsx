"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function AdminNavbar() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleExit = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <header className="app-nav">
      <div className="nav-card">
        <Link
          className="brand-lockup"
          href="/admin/meetings"
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
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--accent-strong)",
              background: "var(--accent-soft)",
              padding: "0.15rem 0.5rem",
              borderRadius: "var(--radius-pill)",
            }}
          >
            관리자
          </span>
        </Link>

        <div className="nav-actions">
          <button
            className="ghost-button"
            onClick={handleExit}
            type="button"
            style={{ minHeight: "2.5rem", padding: "0 0.75rem", gap: "0.35rem" }}
          >
            사용자 전환
          </button>
        </div>
      </div>
    </header>
  );
}
