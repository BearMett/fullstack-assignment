"use client";

import { UserRole } from "@packages/shared";
import Link from "next/link";
import { extractApiErrorMessage } from "@/lib/api-client";
import { formatAnnouncementDate, getMeetingCategoryLabel, getRecruitingStateCopy } from "@/lib/meeting-presenters";
import { useMeetingDetailQuery } from "@/lib/react-query/use-meetings";
import { useAuthStore } from "@/lib/store";
import { AdminManagementPanel } from "./admin-management-panel";
import { UserApplicationPanel } from "./user-application-panel";

type MeetingDetailViewProps = {
  meetingId: number;
};

function DetailLoadingState() {
  return (
    <main className="page-shell">
      <div className="detail-layout">
        <section className="meeting-detail-card stack-lg">
          <div className="loading-block loading-pill" />
          <div className="stack-sm">
            <div className="loading-block loading-title" />
            <div className="loading-block loading-copy" />
            <div className="loading-block loading-copy short" />
          </div>
          <div className="meeting-detail-meta-grid">
            <div className="loading-block loading-meta tall" />
            <div className="loading-block loading-meta tall" />
            <div className="loading-block loading-meta tall" />
            <div className="loading-block loading-meta tall" />
          </div>
        </section>

        <aside className="detail-sidebar">
          <section className="detail-panel-card stack-lg">
            <div className="loading-block loading-title short" />
            <div className="loading-block loading-copy" />
            <div className="loading-block loading-copy short" />
          </section>
        </aside>
      </div>
    </main>
  );
}

export function MeetingDetailView({ meetingId }: MeetingDetailViewProps) {
  const session = useAuthStore((state) => state.session);
  const meetingQuery = useMeetingDetailQuery(meetingId);

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    return (
      <main className="page-shell">
        <div className="page-grid">
          <section className="page-panel empty-card stack-md">
            <span className="section-kicker">Invalid</span>
            <div className="stack-sm">
              <h1 className="section-title section-title-sm">유효한 모임 번호가 아닙니다</h1>
              <p className="section-description">목록으로 돌아가 다시 모임을 선택해 주세요.</p>
            </div>
            <Link className="ghost-link status-link" href="/meetings">
              목록으로 돌아가기
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (meetingQuery.isLoading) {
    return <DetailLoadingState />;
  }

  if (meetingQuery.isError) {
    return (
      <main className="page-shell">
        <div className="page-grid">
          <section className="page-panel empty-card stack-md">
            <span className="section-kicker">Error</span>
            <div className="stack-sm">
              <h1 className="section-title section-title-sm">모임 상세를 불러오지 못했습니다</h1>
              <p className="section-description">
                {extractApiErrorMessage(meetingQuery.error, "잠시 후 다시 시도해 주세요")}
              </p>
            </div>
            <Link className="ghost-link status-link" href="/meetings">
              목록으로 돌아가기
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const meeting = meetingQuery.data;

  if (!meeting) {
    return (
      <main className="page-shell">
        <div className="page-grid">
          <section className="page-panel empty-card stack-md">
            <span className="section-kicker">Unavailable</span>
            <div className="stack-sm">
              <h1 className="section-title section-title-sm">모임 상세를 준비하지 못했습니다</h1>
              <p className="section-description">잠시 후 다시 시도해 주세요.</p>
            </div>
            <Link className="ghost-link status-link" href="/meetings">
              목록으로 돌아가기
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const recruitingState = getRecruitingStateCopy(meeting.isRecruiting);
  const isAdmin = session?.user.role === UserRole.ADMIN;

  return (
    <main className="page-shell">
      <div className="detail-layout">
        <section className="meeting-detail-card stack-lg">
          <div className="meeting-detail-header stack-md">
            <div className="meeting-card-topline">
              <Link className="ghost-link detail-back-link" href="/meetings">
                목록으로 돌아가기
              </Link>
              <span className="meeting-category-pill">{getMeetingCategoryLabel(meeting.category)}</span>
              <span className={`meeting-state-badge ${recruitingState.tone}`}>{recruitingState.label}</span>
            </div>

            <div className="stack-sm">
              <h1 className="section-title detail-title">{meeting.title}</h1>
              <p className="section-description">{meeting.description}</p>
            </div>
          </div>

          <div className="meeting-detail-meta-grid">
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">카테고리</span>
              <strong>{getMeetingCategoryLabel(meeting.category)}</strong>
              <p className="meta-copy">저장 코드는 영어 enum으로 유지하고, 화면에서는 자연스러운 한글 라벨로 보여줍니다.</p>
            </div>
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">발표일</span>
              <strong>{formatAnnouncementDate(meeting.announcementDate)}</strong>
              <p className="meta-copy">{recruitingState.description}</p>
            </div>
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">모집 상태</span>
              <strong>{recruitingState.label}</strong>
              <p className="meta-copy">읽기 전용 탐색 단계에서도 계약 기반 상태를 바로 확인할 수 있습니다.</p>
            </div>
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">신청 현황</span>
              <strong>
                {meeting.applicantCount} / {meeting.maxParticipants}
              </strong>
              <p className="meta-copy">현재까지 접수된 신청 수와 모집 인원을 함께 보여줍니다.</p>
            </div>
          </div>
        </section>

        <aside className="detail-sidebar stack-lg">
          {isAdmin ? (
            <AdminManagementPanel meeting={meeting} />
          ) : (
            <UserApplicationPanel
              key={`${meeting.id}-${meeting.myApplication?.id ?? "none"}-${meeting.canApply ? "apply" : "locked"}`}
              meeting={meeting}
            />
          )}

          <section className="detail-panel-card stack-md">
            <span className="section-kicker">Contract</span>
            <div className="stack-sm">
              <h2 className="detail-panel-title">후속 확장을 위한 안정된 읽기 레이어</h2>
              <p className="detail-panel-copy">
                상세 화면은 실제 모임 계약을 기준으로 구성했고, 이후 사용자 신청 패널과 관리자 관리 패널이 같은 위치와
                데이터 위에서 확장되도록 뼈대를 고정했습니다.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
