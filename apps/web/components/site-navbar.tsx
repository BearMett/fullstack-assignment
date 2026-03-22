"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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

        <div className="nav-actions" style={{ visibility: hasHydrated && session ? "visible" : "hidden" }}>
          <Link
            className={`nav-link ${isMeetingsPath ? "is-active" : ""}`}
            href="/meetings"
            style={{ gap: "0.35rem" }}
          >
            모임 목록
          </Link>
          <Link
            className={`nav-link ${isMyApplicationsPath ? "is-active" : ""}`}
            href="/my-applications"
            style={{ gap: "0.35rem" }}
          >
            내 신청
          </Link>
          <div className="user-menu-wrap" ref={menuRef}>
            <button
              className="nav-chip"
              onClick={() => setMenuOpen((o) => !o)}
              type="button"
              style={{ cursor: "pointer" }}
            >
              <strong>{session?.user.name ?? "\u00A0"}</strong>
            </button>
            {menuOpen && (
              <div className="user-menu-dropdown">
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}>
                  사용자 전환
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
