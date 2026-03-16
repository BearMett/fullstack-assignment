"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export function HomeRedirect() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    router.replace(session ? "/meetings" : "/login");
  }, [hasHydrated, router, session]);

  return (
    <main className="page-shell">
      <div className="status-wrap">
        <section className="status-card stack-lg">
          <span className="section-kicker">Entry</span>
          <div className="stack-sm">
            <h1 className="section-title">알맞은 시작 화면으로 이동하고 있습니다</h1>
            <p className="status-description">
              저장된 세션 여부를 확인해 로그인 또는 모임 화면으로 바로 연결합니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
