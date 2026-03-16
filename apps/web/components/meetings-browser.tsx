"use client";

import { UserRole, type MeetingListItemDto } from "@packages/shared";
import Link from "next/link";
import { extractApiErrorMessage } from "@/lib/api-client";
import { formatAnnouncementDate, getMeetingCategoryLabel, getRecruitingStateCopy } from "@/lib/meeting-presenters";
import { useMeetingsQuery } from "@/lib/react-query/use-meetings";
import { useAuthStore } from "@/lib/store";

function MeetingCard({ meeting }: { meeting: MeetingListItemDto }) {
  const recruitingState = getRecruitingStateCopy(meeting.isRecruiting);

  return (
    <article className="meeting-card stack-lg">
      <div className="meeting-card-header stack-md">
        <div className="meeting-card-topline">
          <span className="meeting-category-pill">{getMeetingCategoryLabel(meeting.category)}</span>
          <span className={`meeting-state-badge ${recruitingState.tone}`}>{recruitingState.label}</span>
        </div>

        <div className="stack-sm">
          <h2 className="meeting-card-title">{meeting.title}</h2>
          <p className="meeting-card-description">{meeting.description}</p>
        </div>
      </div>

      <div className="meeting-card-meta">
        <div className="meeting-meta-item">
          <span className="meta-copy">발표일</span>
          <strong>{formatAnnouncementDate(meeting.announcementDate)}</strong>
        </div>
        <div className="meeting-meta-item">
          <span className="meta-copy">모집 인원</span>
          <strong>{meeting.maxParticipants}명</strong>
        </div>
        <div className="meeting-meta-item">
          <span className="meta-copy">신청 현황</span>
          <strong>{meeting.applicantCount}명 접수</strong>
        </div>
      </div>

      <Link className="ghost-link meeting-card-link" href={`/meetings/${meeting.id}`}>
        자세히 보기
      </Link>
    </article>
  );
}

function LoadingCards() {
  return (
    <div className="meeting-list-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="meeting-card stack-lg" key={`loading-${index}`}>
          <div className="loading-block loading-pill" />
          <div className="stack-sm">
            <div className="loading-block loading-title" />
            <div className="loading-block loading-copy" />
            <div className="loading-block loading-copy short" />
          </div>
          <div className="meeting-card-meta">
            <div className="loading-block loading-meta" />
            <div className="loading-block loading-meta" />
            <div className="loading-block loading-meta" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetingsBrowser() {
  const session = useAuthStore((state) => state.session);
  const meetingsQuery = useMeetingsQuery();
  const meetings = meetingsQuery.data ?? [];
  const recruitingCount = meetings.filter((meeting) => meeting.isRecruiting).length;
  const isAdmin = session?.user.role === UserRole.ADMIN;

  return (
    <main className="page-shell">
      <div className="page-grid meetings-stack">
        <section className="page-panel meetings-hero stack-lg">
          <div className="meetings-hero-copy stack-md">
            <span className="section-kicker">Browse</span>
            <div className="stack-sm">
              <h1 className="section-title">{session?.user.name ?? "회원"}님을 위한 오늘의 모임 공지</h1>
              <p className="section-description">
                인증된 세션을 그대로 활용해 실시간 모집 상태를 읽어오고, 관심 있는 모임의 상세 정보를 차분히 살펴볼 수
                있습니다.
              </p>
            </div>
            {isAdmin ? (
              <div className="hero-action-row">
                <Link className="primary-button" href="/meetings/new">
                  새 모임 만들기
                </Link>
              </div>
            ) : null}
          </div>

          <div className="meetings-summary-grid">
            <div className="meeting-summary-card stack-sm">
              <span className="summary-label">전체 모임</span>
              <strong className="summary-value">{meetingsQuery.isLoading ? "..." : meetings.length}</strong>
              <p className="meta-copy">현재 세션 권한으로 조회 가능한 카드 수입니다.</p>
            </div>
            <div className="meeting-summary-card stack-sm">
              <span className="summary-label">모집 중</span>
              <strong className="summary-value">{meetingsQuery.isLoading ? "..." : recruitingCount}</strong>
              <p className="meta-copy">발표일 이전이라 신청 가능성이 열려 있는 모임입니다.</p>
            </div>
            <div className="meeting-summary-card stack-sm">
              <span className="summary-label">운영 흐름</span>
              <strong className="summary-value">{isAdmin ? "Admin" : "Live"}</strong>
              <p className="meta-copy">
                {isAdmin
                  ? "관리자는 새 모임 생성과 상세 패널 운영까지 같은 탐색 흐름 안에서 이어집니다."
                  : "회원은 신청 가능한 모임을 살펴보고 상세 패널에서 개인 신청 흐름을 이어갑니다."}
              </p>
            </div>
          </div>
        </section>

        {meetingsQuery.isLoading ? <LoadingCards /> : null}

        {meetingsQuery.isError ? (
          <section className="page-panel empty-card stack-md">
            <span className="section-kicker">Error</span>
            <div className="stack-sm">
              <h2 className="section-title section-title-sm">모임 목록을 불러오지 못했습니다</h2>
              <p className="section-description">
                {extractApiErrorMessage(meetingsQuery.error, "잠시 후 다시 시도해 주세요")}
              </p>
            </div>
          </section>
        ) : null}

        {!meetingsQuery.isLoading && !meetingsQuery.isError && meetings.length === 0 ? (
          <section className="page-panel empty-card stack-md">
            <span className="section-kicker">Empty</span>
            <div className="stack-sm">
              <h2 className="section-title section-title-sm">아직 보여드릴 모임이 없습니다</h2>
              <p className="section-description">
                현재 권한에서 조회 가능한 모임이 비어 있습니다. 모집 일정이 열리면 이 화면에 카드가 채워집니다.
              </p>
            </div>
          </section>
        ) : null}

        {!meetingsQuery.isLoading && !meetingsQuery.isError && meetings.length > 0 ? (
          <section className="meeting-list-grid">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
