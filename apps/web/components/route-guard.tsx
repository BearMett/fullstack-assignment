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
    return (
      <GatePanel
        description="저장된 로그인 상태를 확인한 뒤 가장 알맞은 화면으로 안내합니다."
        eyebrow="Session"
        title="세션을 확인하는 중입니다"
      />
    );
  }

  if (session) {
    return (
      <GatePanel
        actionHref="/meetings"
        actionLabel="모임 화면으로 이동"
        description="이미 로그인되어 있어 보호된 모임 화면으로 바로 이동합니다."
        eyebrow="Welcome Back"
        title="잠시만 기다려 주세요"
      />
    );
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
    return (
      <GatePanel
        description="저장된 세션이 있는지 먼저 확인한 뒤 모임 화면을 준비합니다."
        eyebrow="Protected"
        title="보호된 공간을 준비하는 중입니다"
      />
    );
  }

  if (!session) {
    return (
      <GatePanel
        actionHref="/login"
        actionLabel="로그인으로 이동"
        description="모임 화면은 로그인 후 이용할 수 있습니다. 로그인 페이지로 안내합니다."
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
    return (
      <GatePanel
        description="저장된 세션과 권한을 확인한 뒤 관리자 전용 화면을 준비합니다."
        eyebrow="Admin"
        title="운영 권한을 확인하는 중입니다"
      />
    );
  }

  if (!session) {
    return (
      <GatePanel
        actionHref="/login"
        actionLabel="로그인으로 이동"
        description="관리자 화면은 로그인 후 이용할 수 있습니다. 로그인 페이지로 안내합니다."
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
        description="이 화면은 관리자만 사용할 수 있습니다. 현재 계정에서는 모임 탐색과 개인 신청 흐름만 열어 둡니다."
        eyebrow="Admin"
        title="운영 권한이 필요한 화면입니다"
      />
    );
  }

  return <>{children}</>;
}
