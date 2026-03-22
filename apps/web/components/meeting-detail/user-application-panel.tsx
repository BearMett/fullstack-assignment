"use client";

import { type MeetingDetailDto } from "@packages/shared";
import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { formatDateTimeFull, getApplicationStatusCopy } from "@/lib/meeting-presenters";
import { useApplyToMeetingMutation, useCancelMeetingApplicationMutation } from "@/lib/react-query/use-meeting-applications";

type UserApplicationPanelProps = {
  meeting: MeetingDetailDto;
};

type PanelNotice = {
  tone: "success" | "error";
  message: string;
};

export function UserApplicationPanel({ meeting }: UserApplicationPanelProps) {
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const [motivation, setMotivation] = useState("");
  const applyMutation = useApplyToMeetingMutation(meeting.id);
  const cancelMutation = useCancelMeetingApplicationMutation(meeting.id);
  const applicationStatus = meeting.myApplication
    ? getApplicationStatusCopy(meeting.myApplication.displayStatus)
    : null;
  const canCancel = Boolean(meeting.canCancel);
  const isBusy = applyMutation.isPending || cancelMutation.isPending;

  const handleApply = () => {
    setNotice(null);

    applyMutation.mutate(
      { motivation: motivation.trim() || undefined },
      {
        onSuccess: () => {
          setNotice({
            tone: "success",
            message: "신청이 접수되었습니다.",
          });
          setMotivation("");
        },
        onError: (error) => {
          setNotice({
            tone: "error",
            message: extractApiErrorMessage(error, "신청을 접수하지 못했습니다"),
          });
        },
      }
    );
  };

  const handleCancel = () => {
    if (!meeting.myApplication) return;
    setNotice(null);

    cancelMutation.mutate(meeting.myApplication.id, {
      onSuccess: () => {
        setNotice({
          tone: "success",
          message: "신청을 취소했습니다.",
        });
      },
      onError: (error) => {
        setNotice({
          tone: "error",
          message: extractApiErrorMessage(error, "신청을 취소하지 못했습니다"),
        });
      },
    });
  };

  // User has already applied
  if (meeting.myApplication) {
    const isBeforeAnnouncement = new Date(meeting.announcement) > new Date();

    return (
      <section className="detail-panel-card stack-md">
        <h2 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.15rem", fontWeight: 700 }}>
          내 신청 현황
        </h2>

        {notice ? (
          <p className={`status-banner ${notice.tone === "success" ? "success-banner" : ""}`}>
            {notice.message}
          </p>
        ) : null}

        {isBeforeAnnouncement ? (
          <>
            <span className="application-status is-pending">결과 발표 전</span>
            <div
              style={{
                background: "var(--accent-soft)",
                borderRadius: "1rem",
                padding: "0.75rem 1rem",
                fontSize: "0.88rem",
                color: "var(--accent-strong)",
              }}
            >
              ⏳ 결과는 {formatDateTimeFull(meeting.announcement)} 이후에 확인할 수 있어요.
            </div>
          </>
        ) : (
          <>
            <span className={`application-status ${applicationStatus?.tone ?? "is-pending"}`}>
              {applicationStatus?.label === "선정" ? "선정되었어요" : applicationStatus?.label === "미선정" ? "미선정" : applicationStatus?.label}
            </span>
            <p className="detail-panel-copy">{meeting.myApplication.resultMessage}</p>
          </>
        )}

        {canCancel ? (
          <button className="ghost-button" disabled={isBusy} onClick={handleCancel} type="button" style={{ width: "100%" }}>
            {cancelMutation.isPending ? "취소 처리 중..." : "신청 취소하기"}
          </button>
        ) : null}
      </section>
    );
  }

  // Can apply
  if (meeting.canApply) {
    return (
      <section className="detail-panel-card stack-md">
        <h2 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.15rem", fontWeight: 700 }}>
          모임 신청
        </h2>

        {notice ? (
          <p className={`status-banner ${notice.tone === "success" ? "success-banner" : ""}`}>
            {notice.message}
          </p>
        ) : null}

        <label className="auth-field">
          <span className="auth-label">지원 동기 (선택)</span>
          <textarea
            className="auth-input auth-textarea"
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="이 모임에 참여하고 싶은 이유를 알려주세요..."
            value={motivation}
          />
        </label>

        <button className="primary-button" disabled={isBusy} onClick={handleApply} type="button" style={{ width: "100%" }}>
          {applyMutation.isPending ? "신청 접수 중..." : "이 모임 신청하기"}
        </button>
      </section>
    );
  }

  // Cannot apply
  return (
    <section className="detail-panel-card stack-md">
      <h2 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.15rem", fontWeight: 700 }}>
        모임 신청
      </h2>
      <p className="detail-panel-copy">현재는 신청을 진행할 수 없는 상태입니다.</p>
    </section>
  );
}
