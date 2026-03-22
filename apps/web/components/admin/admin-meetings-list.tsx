"use client";

import { type MeetingListItemDto, MeetingCategory } from "@packages/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getMeetingCategoryIcon, getMeetingCategoryLabel, getRelativeDateLabel } from "@/lib/meeting-presenters";
import { useMeetingsQuery } from "@/lib/react-query/use-meetings";

function getAdminMeetingStatus(meeting: MeetingListItemDto): { label: string; tone: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (meeting.deadlineDate >= today) {
    return { label: "모집 중", tone: "is-open" };
  }
  return { label: "결과 확정", tone: "is-closed" };
}

export function AdminMeetingsList() {
  const meetingsQuery = useMeetingsQuery({ includeClosed: true });
  const meetings = meetingsQuery.data ?? [];
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const q = searchQuery.trim().toLowerCase();
    return meetings.filter((m) => m.title.toLowerCase().includes(q));
  }, [meetings, searchQuery]);

  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="stack-sm">
            <h1 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.04em" }}>
              모임 관리
            </h1>
            <p className="meta-copy">모임을 생성하고 신청자를 관리하세요</p>
          </div>
          <Link className="primary-button" href="/admin/meetings/new" style={{ gap: "0.35rem" }}>
            + 새 모임 만들기
          </Link>
        </div>

        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink-subtle)", fontSize: "0.9rem" }}>🔍</span>
          <input
            className="auth-input"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="모임 검색..."
            type="text"
            value={searchQuery}
            style={{ width: "100%", paddingLeft: "2.5rem" }}
          />
        </div>

        {meetingsQuery.isLoading ? (
          <div className="stack-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="loading-block" key={i} style={{ height: "3.5rem", borderRadius: "1rem" }} />
            ))}
          </div>
        ) : null}

        {!meetingsQuery.isLoading && filteredMeetings.length > 0 ? (
          <div style={{ border: "1px solid var(--line-soft)", borderRadius: "var(--radius-card)", background: "var(--surface-card)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 1fr 1fr 1fr 0.5fr", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--line-soft)", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>모임</span>
              <span>종류</span>
              <span>인원</span>
              <span>마감일</span>
              <span>발표일</span>
              <span>상태</span>
            </div>
            {filteredMeetings.map((meeting) => {
              const status = getAdminMeetingStatus(meeting);
              const category = meeting.category as MeetingCategory;
              return (
                <Link
                  key={meeting.id}
                  href={`/admin/meetings/${meeting.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 0.7fr 1fr 1fr 1fr 0.5fr",
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid var(--line-soft)",
                    textDecoration: "none",
                    color: "inherit",
                    fontSize: "0.9rem",
                    alignItems: "center",
                    transition: "background 150ms",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{meeting.title}</span>
                  <span>
                    <span className="meeting-state-badge" style={{ background: "rgba(255,255,255,0.72)", border: "1px solid var(--line-soft)", fontSize: "0.78rem", minHeight: "1.8rem", padding: "0 0.6rem" }}>
                      {getMeetingCategoryIcon(category)} {getMeetingCategoryLabel(category)}
                    </span>
                  </span>
                  <span>{meeting.maxParticipants}명 <span style={{ color: "var(--ink-subtle)", fontSize: "0.8rem" }}>({meeting.applicantCount}명 신청)</span></span>
                  <span>{meeting.deadlineDate} <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.35rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem" }}>{getRelativeDateLabel(meeting.deadlineDate)}</span></span>
                  <span>{meeting.announcementDate} <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.35rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem" }}>{getRelativeDateLabel(meeting.announcementDate)}</span></span>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className={`meeting-state-badge ${status.tone}`} style={{ fontSize: "0.78rem", minHeight: "1.8rem", padding: "0 0.6rem", whiteSpace: "nowrap" }}>{status.label}</span>
                    <span style={{ color: "var(--ink-subtle)" }}>›</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}

        {!meetingsQuery.isLoading && filteredMeetings.length === 0 ? (
          <section className="page-panel empty-card stack-md" style={{ padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontWeight: 700 }}>모임이 없습니다</h2>
            <p className="meta-copy">새 모임을 만들어보세요.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
