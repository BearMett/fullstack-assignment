"use client";

import { UserRole } from "@packages/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/store";

type GatePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

function GatePanel({ eyebrow, title, description, actionHref, actionLabel }: GatePanelProps) {
  return (
    <main className="page-shell" data-testid="page-shell">
      <div className="status-wrap">
        <section className="status-card stack-lg">
          <span className="section-kicker">{eyebrow}</span>
          <div className="stack-sm">
            <h1 className="section-title">{title}</h1>
            <p className="status-description">{description}</p>
          </div>
          {actionHref && actionLabel ? (
            <Link className="status-link" href={actionHref}>
              {actionLabel}
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function HydrationShell() {
  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
        <div className="stack-md" style={{ paddingTop: "0.5rem" }}>
          <div className="loading-block loading-pill" />
          <div className="loading-block loading-title" />
          <div className="loading-block loading-copy" />
          <div className="loading-block loading-copy short" />
        </div>
      </div>
    </main>
  );
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && session) {
      router.replace("/meetings");
    }
  }, [hasHydrated, router, session]);

  if (!hasHydrated) {
    return <HydrationShell />;
  }

  if (session) {
    return <HydrationShell />;
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !session) {
      router.replace("/login");
    }
  }, [hasHydrated, router, session]);

  if (!hasHydrated) {
    return <HydrationShell />;
  }

  if (!session) {
    return (
      <GatePanel
        actionHref="/login"
        actionLabel="로그인으로 이동"
        description="모임 화면은 로그인 후 이용할 수 있습니다."
        eyebrow="Protected"
        title="로그인이 필요합니다"
      />
    );
  }

  return <>{children}</>;
}

export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !session) {
      router.replace("/login");
    }
  }, [hasHydrated, router, session]);

  if (!hasHydrated) {
    return <HydrationShell />;
  }

  if (!session) {
    return (
      <GatePanel
        actionHref="/login"
        actionLabel="로그인으로 이동"
        description="관리자 화면은 로그인 후 이용할 수 있습니다."
        eyebrow="Admin"
        title="로그인이 필요합니다"
      />
    );
  }

  if (session.user.role !== UserRole.ADMIN) {
    return (
      <GatePanel
        actionHref="/meetings"
        actionLabel="모임 목록으로 이동"
        description="이 화면은 관리자만 사용할 수 있습니다."
        eyebrow="Admin"
        title="운영 권한이 필요한 화면입니다"
      />
    );
  }

  return <>{children}</>;
}
