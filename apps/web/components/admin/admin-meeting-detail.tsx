"use client";

import { ApplicationStatus, type ApplicationItemDto } from "@packages/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import {
  getApplicationStatusCopy,
  getMeetingStatusBadges,
  getRelativeDateLabel,
} from "@/lib/meeting-presenters";
import { useMeetingDetailQuery } from "@/lib/react-query/use-meetings";
import {
  useBatchUpdateMeetingApplicationStatusMutation,
  useMeetingApplicantsQuery,
  useUpdateMeetingApplicationStatusMutation,
} from "@/lib/react-query/use-meeting-applications";

type StatusFilter = "ALL" | ApplicationStatus;

type PanelNotice = {
  tone: "success" | "error";
  message: string;
};

const EMPTY_APPLICANTS: ApplicationItemDto[] = [];

const applicantDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
});

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return applicantDateFormatter.format(date);
}

export function AdminMeetingDetail({ meetingId }: { meetingId: number }) {
  const meetingQuery = useMeetingDetailQuery(meetingId);
  const applicantsQuery = useMeetingApplicantsQuery(meetingId);
  const updateStatusMutation = useUpdateMeetingApplicationStatusMutation(meetingId);
  const batchUpdateMutation = useBatchUpdateMeetingApplicationStatusMutation(meetingId);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [confirmingAction, setConfirmingAction] = useState<{ id: number; status: ApplicationStatus } | null>(null);

  const meeting = meetingQuery.data;
  const applicants = applicantsQuery.data ?? EMPTY_APPLICANTS;
  const isBusy = updateStatusMutation.isPending || batchUpdateMutation.isPending;

  const filteredApplicants = useMemo(() => {
    if (statusFilter === "ALL") return applicants;
    return applicants.filter((a) => a.status === statusFilter);
  }, [applicants, statusFilter]);

  const allSelected = filteredApplicants.length > 0 && filteredApplicants.every((a) => selectedIds.includes(a.id));

  const handleToggle = (id: number, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplicants.map((a) => a.id));
    }
  };

  const handleSingleAction = (applicationId: number, status: ApplicationStatus) => {
    setNotice(null);
    setConfirmingAction(null);
    updateStatusMutation.mutate(
      { applicationId, status },
      {
        onSuccess: () => {
          setNotice({ tone: "success", message: status === ApplicationStatus.SELECTED ? "선정 처리했습니다." : "선정을 취소했습니다." });
        },
        onError: (error) => {
          setNotice({ tone: "error", message: extractApiErrorMessage(error, "상태를 변경하지 못했습니다") });
        },
      }
    );
  };

  const handleBatchAction = (status: ApplicationStatus) => {
    if (selectedIds.length === 0) return;
    setNotice(null);
    batchUpdateMutation.mutate(
      { updates: selectedIds.map((id) => ({ applicationId: id, status })) },
      {
        onSuccess: () => {
          setSelectedIds([]);
          setNotice({ tone: "success", message: `${selectedIds.length}건을 일괄 처리했습니다.` });
        },
        onError: (error) => {
          setNotice({ tone: "error", message: extractApiErrorMessage(error, "일괄 처리에 실패했습니다") });
        },
      }
    );
  };

  if (meetingQuery.isLoading) {
    return (
      <main className="page-shell" data-testid="page-shell">
        <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
          <div className="loading-block" style={{ height: "12rem", borderRadius: "var(--radius-card)" }} />
        </div>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main className="page-shell" data-testid="page-shell">
        <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
          <section className="page-panel empty-card stack-md">
            <h1 style={{ fontWeight: 700 }}>모임을 찾을 수 없습니다</h1>
            <Link className="ghost-link status-link" href="/admin/meetings">모임 관리로</Link>
          </section>
        </div>
      </main>
    );
  }

  const badges = getMeetingStatusBadges(meeting, { isAdmin: true });
  const today = new Date().toISOString().slice(0, 10);
  const isAnnouncementPast = meeting.announcementDate <= today;

  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, var(--content-width))" }}>
        <Link
          href="/admin/meetings"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--ink-subtle)", fontSize: "0.9rem", marginBottom: "1rem" }}
        >
          ← 모임 관리로 돌아가기
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
                    : badge.tone === "reapply"
                      ? { background: "var(--success-soft)", border: "1px solid rgba(58,116,82,0.2)", color: "var(--success-ink)" }
                      : undefined
                }
              >
                {badge.label}
              </span>
            ))}
          </div>

          <h1 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.04em" }}>
            {meeting.title}
          </h1>

          <p className="detail-panel-copy">{meeting.description}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "모집 인원", value: `${meeting.maxParticipants}명` },
              { label: "신청 수", value: `${meeting.applicantCount}명` },
              { label: "선정", value: `${meeting.selectedCount ?? 0}명` },
              { label: "남은 자리", value: `${meeting.maxParticipants - (meeting.selectedCount ?? 0)}명` },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  border: "1px solid var(--line-soft)",
                  borderRadius: "1rem",
                  padding: "0.75rem",
                  textAlign: "center",
                  background: stat.label === "선정" ? "var(--success-soft)" : "var(--surface-soft)",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--ink-subtle)", marginBottom: "0.25rem" }}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-display), serif", fontSize: "1.25rem", fontWeight: 700 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.88rem", color: "var(--ink-subtle)" }}>
            <span>📅 마감 {meeting.deadlineDate} <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.35rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem" }}>{getRelativeDateLabel(meeting.deadlineDate)}</span></span>
            <span>🕐 발표 {meeting.announcementDate} <span style={{ background: "var(--neutral-soft)", padding: "0.1rem 0.35rem", borderRadius: "var(--radius-pill)", fontSize: "0.75rem" }}>{getRelativeDateLabel(meeting.announcementDate)}</span></span>
          </div>

          {isAnnouncementPast && (
            <div style={{ background: "var(--accent-soft)", borderRadius: "1rem", padding: "0.75rem 1rem", fontSize: "0.88rem", color: "var(--accent-strong)" }}>
              ⓘ 발표일이 지났습니다. 사용자에게 선정/탈락 결과가 공개됩니다.
            </div>
          )}
        </section>

        {notice ? (
          <p className={`status-banner ${notice.tone === "success" ? "success-banner" : ""}`} style={{ marginTop: "1rem" }}>
            {notice.message}
          </p>
        ) : null}

        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.15rem", fontWeight: 700 }}>
              👥 신청자 목록 ({applicants.length}명)
            </h2>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {(["ALL", ApplicationStatus.PENDING, ApplicationStatus.SELECTED, ApplicationStatus.REJECTED] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  type="button"
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--line-soft)",
                    background: statusFilter === f ? "var(--accent)" : "rgba(255,255,255,0.5)",
                    color: statusFilter === f ? "#fff" : "var(--foreground)",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  {f === "ALL" ? "전체" : f === "PENDING" ? "대기" : f === "SELECTED" ? "선정" : "탈락"}
                </button>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button className="primary-button" disabled={isBusy} onClick={() => handleBatchAction(ApplicationStatus.SELECTED)} type="button" style={{ fontSize: "0.85rem", minHeight: "2.2rem", padding: "0 0.75rem" }}>
                선택 항목 선정
              </button>
              <button className="ghost-button" disabled={isBusy} onClick={() => handleBatchAction(ApplicationStatus.REJECTED)} type="button" style={{ fontSize: "0.85rem", minHeight: "2.2rem", padding: "0 0.75rem" }}>
                선택 항목 탈락
              </button>
            </div>
          )}

          {applicantsQuery.isLoading ? (
            <div className="stack-md">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="loading-block" key={i} style={{ height: "3rem", borderRadius: "1rem" }} />
              ))}
            </div>
          ) : filteredApplicants.length === 0 ? (
            <section className="page-panel empty-card stack-md" style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ fontWeight: 700 }}>신청자가 없습니다</p>
            </section>
          ) : (
            <div style={{ border: "1px solid var(--line-soft)", borderRadius: "var(--radius-card)", background: "var(--surface-card)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.5rem 1fr 1fr 2fr 0.7fr 0.7fr minmax(5.5rem, auto)", padding: "0.65rem 1rem", borderBottom: "1px solid var(--line-soft)", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>
                  <input type="checkbox" checked={allSelected} onChange={handleToggleAll} disabled={isBusy} style={{ accentColor: "var(--accent)" }} />
                </span>
                <span>이름</span>
                <span>연락처</span>
                <span>지원 동기</span>
                <span>신청일</span>
                <span>상태</span>
                <span>관리</span>
              </div>
              {filteredApplicants.map((applicant) => {
                const statusCopy = getApplicationStatusCopy(applicant.status);
                const isSelected = applicant.status === ApplicationStatus.SELECTED;
                const nextStatus = isSelected ? ApplicationStatus.REJECTED : ApplicationStatus.SELECTED;
                const actionLabel = isSelected ? "선정 취소" : "선정";
                const isConfirming = confirmingAction?.id === applicant.id && confirmingAction?.status === nextStatus;

                return (
                  <div
                    key={applicant.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.5rem 1fr 1fr 2fr 0.7fr 0.7fr minmax(5.5rem, auto)",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--line-soft)",
                      fontSize: "0.88rem",
                      alignItems: "center",
                      background: isConfirming ? "rgba(186, 88, 54, 0.04)" : undefined,
                    }}
                  >
                    <span>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(applicant.id)}
                        onChange={(e) => handleToggle(applicant.id, e.target.checked)}
                        disabled={isBusy}
                        style={{ accentColor: "var(--accent)" }}
                      />
                    </span>
                    <span style={{ fontWeight: 600 }}>{applicant.userName ?? `회원 #${applicant.userId}`}</span>
                    <span style={{ color: "var(--ink-subtle)" }}>{applicant.userPhone ?? "-"}</span>
                    <span style={{ color: "var(--ink-subtle)", fontSize: "0.82rem" }}>
                      {applicant.motivation ? (
                        <span title={applicant.motivation}>
                          {applicant.motivation.length > 40 ? `${applicant.motivation.slice(0, 40)}...` : applicant.motivation}
                        </span>
                      ) : "-"}
                    </span>
                    <span style={{ fontSize: "0.82rem" }}>{formatShortDate(applicant.createdAt)}</span>
                    <span>
                      <span className={`application-status ${statusCopy.tone}`} style={{ fontSize: "0.75rem", minHeight: "1.6rem", padding: "0 0.5rem" }}>
                        {statusCopy.label}
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleSingleAction(applicant.id, nextStatus)}
                            disabled={isBusy}
                            type="button"
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "var(--radius-pill)",
                              border: "1px solid var(--accent)",
                              background: "var(--accent)",
                              color: "#fff",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            확정
                          </button>
                          <button
                            onClick={() => setConfirmingAction(null)}
                            type="button"
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "var(--radius-pill)",
                              border: "1px solid var(--line-soft)",
                              background: "rgba(255,255,255,0.6)",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmingAction({ id: applicant.id, status: nextStatus })}
                          disabled={isBusy}
                          type="button"
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "var(--radius-pill)",
                            border: `1px solid ${isSelected ? "var(--line-soft)" : "rgba(58,116,82,0.3)"}`,
                            background: isSelected ? "rgba(255,255,255,0.6)" : "var(--success-soft)",
                            color: isSelected ? "var(--foreground)" : "var(--success-ink)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {actionLabel}
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
