"use client";

import { UserRole } from "@packages/shared";
import { useAuthStore } from "@/lib/store";

const roleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]: "관리자",
  [UserRole.USER]: "회원",
};

export function MeetingsPlaceholder() {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return null;
  }

  return (
    <main className="page-shell">
      <div className="placeholder-layout">
        <section className="placeholder-card stack-lg">
          <span className="section-kicker">Meetings</span>
          <div className="stack-md">
            <h1 className="section-title">{session.user.name}님, 이제 모임 화면이 열릴 준비가 되었습니다</h1>
            <p className="placeholder-copy">
              현재 단계에서는 인증된 사용자가 보호된 경로에 도달하는 흐름만 확보했습니다. 이후 작업에서 실제 모임
              목록과 신청 경험을 이 자리에 연결하면 됩니다.
            </p>
          </div>

          <div className="placeholder-list">
            <div className="placeholder-item">
              <span className="placeholder-index">01</span>
              <div>
                <strong>로그인과 회원가입이 끝나면 이 보호된 화면으로 바로 이동합니다.</strong>
              </div>
            </div>
            <div className="placeholder-item">
              <span className="placeholder-index">02</span>
              <div>
                <strong>세션은 스토어에 유지되며 네비게이션에서 현재 사용자 정보를 확인할 수 있습니다.</strong>
              </div>
            </div>
            <div className="placeholder-item">
              <span className="placeholder-index">03</span>
              <div>
                <strong>로그아웃하면 세션이 정리되고 다시 로그인 화면으로 돌아갑니다.</strong>
              </div>
            </div>
          </div>
        </section>

        <aside className="placeholder-card stack-lg">
          <span className="section-kicker">Current Session</span>
          <div className="placeholder-meta">
            <div className="meta-row">
              <span className="meta-copy">이름</span>
              <span>{session.user.name}</span>
            </div>
            <div className="meta-row">
              <span className="meta-copy">이메일</span>
              <span>{session.user.email}</span>
            </div>
            <div className="meta-row">
              <span className="meta-copy">권한</span>
              <span>{roleLabel[session.user.role]}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
