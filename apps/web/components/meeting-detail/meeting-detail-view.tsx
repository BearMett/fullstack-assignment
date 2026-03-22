"use client";

import Link from "next/link";
import { extractApiErrorMessage } from "@/lib/api-client";
import {
  getMeetingStatusBadges,
  getRelativeDateLabel,
} from "@/lib/meeting-presenters";
import { useMeetingDetailQuery } from "@/lib/react-query/use-meetings";
import { UserApplicationPanel } from "./user-application-panel";

type MeetingDetailViewProps = {
  meetingId: number;
};

function DetailLoadingState() {
  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
        <div className="meeting-detail-card stack-lg">
          <div className="loading-block loading-pill" />
          <div className="stack-sm">
            <div className="loading-block loading-title" />
            <div className="loading-block loading-copy" />
            <div className="loading-block loading-copy short" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function MeetingDetailView({ meetingId }: MeetingDetailViewProps) {
  const meetingQuery = useMeetingDetailQuery(meetingId);

  if (!Number.isInteger(meetingId) || meetingId <= 0) {
    return (
      <main className="page-shell" data-testid="page-shell">
        <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
          <section className="page-panel empty-card stack-md">
            <h1 style={{ fontWeight: 700 }}>유효한 모임 번호가 아닙니다</h1>
            <p className="meta-copy">목록으로 돌아가 다시 모임을 선택해 주세요.</p>
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
      <main className="page-shell" data-testid="page-shell">
        <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
          <section className="page-panel empty-card stack-md">
            <h1 style={{ fontWeight: 700 }}>모임 상세를 불러오지 못했습니다</h1>
            <p className="meta-copy">
              {extractApiErrorMessage(meetingQuery.error, "잠시 후 다시 시도해 주세요")}
            </p>
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
      <main className="page-shell" data-testid="page-shell">
        <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
          <section className="page-panel empty-card stack-md">
            <h1 style={{ fontWeight: 700 }}>모임 상세를 준비하지 못했습니다</h1>
            <Link className="ghost-link status-link" href="/meetings">
              목록으로 돌아가기
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const badges = getMeetingStatusBadges(meeting);

  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))", maxWidth: "52rem" }}>
        <Link
          href="/meetings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "var(--ink-subtle)",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          ← 모임 목록으로
        </Link>

        <section className="meeting-detail-card stack-lg">
          <div className="meeting-card-topline">
            {badges.map((badge, i) => (
              <span
                key={i}
                className={`meeting-state-badge ${badge.tone === "is-open" ? "is-open" : badge.tone === "is-closed" ? "is-closed" : ""}`}
                style={
                  badge.tone === "category"
                    ? { background: "rgba(255,255,255,0.72)", border: "1px solid var(--line-soft)" }
                    : undefined
                }
              >
                {badge.label}
              </span>
            ))}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            {meeting.title}
          </h1>

          <p className="detail-panel-copy">{meeting.description}</p>

          <div
            style={{
              borderTop: "1px solid var(--line-soft)",
              paddingTop: "1rem",
              display: "grid",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>정원 <strong>{meeting.maxParticipants}명</strong></span>
              <span style={{ color: "var(--ink-subtle)" }}>·</span>
              <span>신청 <strong>{meeting.applicantCount}명</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>
                신청 마감 <strong>{meeting.deadlineDate}</strong>{" "}
                <span
                  style={{
                    background: "var(--neutral-soft)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "0.8rem",
                  }}
                >
                  {getRelativeDateLabel(meeting.deadlineDate)}
                </span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>
                결과 발표 <strong>{meeting.announcementDate}</strong>{" "}
                <span
                  style={{
                    background: "var(--neutral-soft)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "0.8rem",
                  }}
                >
                  {getRelativeDateLabel(meeting.announcementDate)}
                </span>
              </span>
            </div>
          </div>

        </section>

        <div style={{ marginTop: "1.25rem" }}>
          <UserApplicationPanel
            key={`${meeting.id}-${meeting.myApplication?.id ?? "none"}-${meeting.canApply ? "apply" : "locked"}`}
            meeting={meeting}
          />
        </div>
      </div>
    </main>
  );
}
