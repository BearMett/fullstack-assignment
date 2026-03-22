"use client";

import Link from "next/link";
import { type MyApplicationItemDto } from "@packages/shared";
import { getMeetingCategoryIcon, getMeetingCategoryLabel, getRelativeDateLabel } from "@/lib/meeting-presenters";
import { useMyApplicationsQuery } from "@/lib/react-query/use-meeting-applications";
import { MeetingCategory } from "@packages/shared";

function ApplicationCard({ application }: { application: MyApplicationItemDto }) {
  const isBeforeAnnouncement = (() => {
    const today = new Date().toISOString().slice(0, 10);
    return application.announcementDate > today;
  })();

  const category = application.meetingCategory as MeetingCategory;

  return (
    <Link href={`/meetings/${application.meetingId}`} style={{ textDecoration: "none", color: "inherit" }}>
      <article className="meeting-card stack-md" style={{ cursor: "pointer" }}>
        <div className="meeting-card-topline">
          <span
            className="meeting-state-badge"
            style={{ background: "rgba(255,255,255,0.72)", border: "1px solid var(--line-soft)" }}
          >
            {getMeetingCategoryIcon(category)} {getMeetingCategoryLabel(category)}
          </span>

          {isBeforeAnnouncement ? (
            <span className="meeting-state-badge is-closed">
              🕐 결과 발표 전
            </span>
          ) : application.displayStatus === "SELECTED" ? (
            <span className="meeting-state-badge is-open">
              선정되었어요
            </span>
          ) : application.displayStatus === "REJECTED" ? (
            <span className="meeting-state-badge" style={{ background: "var(--neutral-soft)", border: "1px solid var(--line-soft)" }}>
              미선정
            </span>
          ) : (
            <span className="meeting-state-badge is-closed">
              대기 중
            </span>
          )}
        </div>

        <h2 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          {application.meetingTitle}
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.85rem", color: "var(--ink-subtle)" }}>
          <span>신청일: {application.createdAt.slice(0, 19).replace("T", " ")}</span>
          <span>
            · 🕐 발표 <strong>{application.announcementDate}</strong>{" "}
            <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.4rem", borderRadius: "var(--radius-pill)", fontSize: "0.8rem" }}>
              {getRelativeDateLabel(application.announcementDate)}
            </span>
          </span>
        </div>

        {isBeforeAnnouncement && (
          <p style={{ fontSize: "0.85rem", color: "var(--accent-strong)" }}>
            발표일 이후 결과 확인 가능
          </p>
        )}

        <span style={{ position: "absolute", right: "1.35rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-subtle)", fontSize: "1.2rem" }}>›</span>
      </article>
    </Link>
  );
}

export function MyApplicationsScreen() {
  const applicationsQuery = useMyApplicationsQuery();
  const applications = applicationsQuery.data ?? [];

  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
        <div className="stack-sm" style={{ marginBottom: "1rem" }}>
          <h1 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.04em" }}>
            내 신청 내역
          </h1>
          <p className="meta-copy">신청한 모임의 현황을 확인하세요</p>
        </div>

        {applicationsQuery.isLoading ? (
          <div className="stack-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="meeting-card stack-md" key={i}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div className="loading-block" style={{ height: "2.2rem", width: "5rem", borderRadius: "var(--radius-pill)" }} />
                  <div className="loading-block" style={{ height: "2.2rem", width: "5.5rem", borderRadius: "var(--radius-pill)" }} />
                </div>
                <div className="loading-block" style={{ height: "1.4rem", width: "60%", borderRadius: "0.7rem" }} />
                <div className="loading-block loading-copy short" />
              </div>
            ))}
          </div>
        ) : null}

        {!applicationsQuery.isLoading && applications.length === 0 ? (
          <section className="page-panel empty-card stack-md" style={{ padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontWeight: 700 }}>아직 신청한 모임이 없습니다</h2>
            <p className="meta-copy">모임 목록에서 관심 있는 모임에 신청해보세요.</p>
            <Link className="ghost-link status-link" href="/meetings">
              모임 목록으로
            </Link>
          </section>
        ) : null}

        {!applicationsQuery.isLoading && applications.length > 0 ? (
          <div className="stack-md">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
