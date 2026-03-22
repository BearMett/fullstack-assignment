"use client";

import { MeetingCategory, type MeetingListItemDto } from "@packages/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import {
  getMeetingStatusBadges,
  getRelativeDateLabel,
} from "@/lib/meeting-presenters";
import { useMeetingsQuery } from "@/lib/react-query/use-meetings";

type CategoryFilter = "ALL" | MeetingCategory;

const categoryFilters: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: MeetingCategory.READING, label: "독서" },
  { value: MeetingCategory.EXERCISE, label: "운동" },
  { value: MeetingCategory.WRITING, label: "기록" },
  { value: MeetingCategory.ENGLISH, label: "영어" },
];

function MeetingCard({ meeting }: { meeting: MeetingListItemDto }) {
  const badges = getMeetingStatusBadges(meeting);

  return (
    <Link href={`/meetings/${meeting.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <article className="meeting-card stack-md" style={{ cursor: "pointer" }}>
        <div className="meeting-card-topline">
          {badges.map((badge, i) => (
            <span
              key={i}
              className={`meeting-state-badge ${badge.tone === "is-open" ? "is-open" : badge.tone === "is-closed" ? "is-closed" : ""}`}
              style={
                badge.tone === "category"
                  ? { background: "rgba(255,255,255,0.72)", border: "1px solid var(--line-soft)" }
                  : badge.tone === "reapply"
                    ? { background: "var(--success-soft)", border: "1px solid rgba(58,116,82,0.2)", color: "var(--success-ink)" }
                    : undefined
              }
            >
              {badge.label}
            </span>
          ))}
        </div>

        <h2
          className="meeting-card-title"
          style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}
        >
          {meeting.title}
        </h2>

        <p className="meeting-card-description" style={{ fontSize: "0.92rem" }}>
          {meeting.description}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.85rem",
            color: "var(--ink-subtle)",
            borderTop: "1px solid var(--line-soft)",
            paddingTop: "0.75rem",
          }}
        >
          <span>모집 {meeting.applicantCount}/{meeting.maxParticipants}명</span>
          <span>마감 {meeting.deadlineDate} <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.4rem", borderRadius: "var(--radius-pill)", fontSize: "0.8rem" }}>{getRelativeDateLabel(meeting.deadlineDate)}</span></span>
          <span>발표 {meeting.announcementDate} <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.4rem", borderRadius: "var(--radius-pill)", fontSize: "0.8rem" }}>{getRelativeDateLabel(meeting.announcementDate)}</span></span>
        </div>
      </article>
    </Link>
  );
}

function LoadingCards() {
  return (
    <div className="stack-md">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="meeting-card stack-md" key={`loading-${index}`}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div className="loading-block" style={{ height: "2.2rem", width: "5rem", borderRadius: "var(--radius-pill)" }} />
            <div className="loading-block" style={{ height: "2.2rem", width: "4.5rem", borderRadius: "var(--radius-pill)" }} />
          </div>
          <div className="loading-block" style={{ height: "1.4rem", width: "70%", borderRadius: "0.7rem" }} />
          <div className="stack-sm">
            <div className="loading-block loading-copy" />
            <div className="loading-block loading-copy short" />
          </div>
          <div className="loading-block" style={{ height: "1rem", width: "80%", borderRadius: "0.5rem", borderTop: "1px solid var(--line-soft)", paddingTop: "0.75rem" }} />
        </div>
      ))}
    </div>
  );
}

export function MeetingsBrowser() {
  const meetingsQuery = useMeetingsQuery();
  const meetings = meetingsQuery.data ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");

  const filteredMeetings = useMemo(() => {
    let result = meetings;

    if (categoryFilter !== "ALL") {
      result = result.filter((m) => m.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [meetings, categoryFilter, searchQuery]);

  return (
    <main className="page-shell" data-testid="page-shell">
      <div className="page-grid" style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
        <div className="stack-sm" style={{ marginBottom: "0.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            모임 목록
          </h1>
          <p className="meta-copy">관심 있는 모임에 신청해보세요</p>
        </div>

        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-subtle)",
              fontSize: "0.9rem",
            }}
          >
            🔍
          </span>
          <input
            className="auth-input"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="모임 검색..."
            type="text"
            value={searchQuery}
            style={{ width: "100%", paddingLeft: "2.5rem" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            margin: "0.5rem 0",
          }}
        >
          {categoryFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setCategoryFilter(filter.value)}
              type="button"
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--line-soft)",
                background:
                  categoryFilter === filter.value
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.5)",
                color: categoryFilter === filter.value ? "#fff" : "var(--foreground)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 180ms ease",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {meetingsQuery.isLoading ? <LoadingCards /> : null}

        {meetingsQuery.isError ? (
          <section className="page-panel empty-card stack-md">
            <h2 style={{ fontWeight: 700 }}>모임 목록을 불러오지 못했습니다</h2>
            <p className="meta-copy">
              {extractApiErrorMessage(meetingsQuery.error, "잠시 후 다시 시도해 주세요")}
            </p>
          </section>
        ) : null}

        {!meetingsQuery.isLoading && !meetingsQuery.isError && filteredMeetings.length === 0 ? (
          <section className="page-panel empty-card stack-md" style={{ padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontWeight: 700 }}>표시할 모임이 없습니다</h2>
            <p className="meta-copy">검색 조건을 변경하거나 다른 카테고리를 선택해보세요.</p>
          </section>
        ) : null}

        {!meetingsQuery.isLoading && !meetingsQuery.isError && filteredMeetings.length > 0 ? (
          <div className="stack-md">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
