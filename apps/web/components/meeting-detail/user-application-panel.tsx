"use client";

import { type MeetingDetailDto } from "@packages/shared";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { formatAnnouncementDate, getApplicationStatusCopy } from "@/lib/meeting-presenters";
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
  const applyMutation = useApplyToMeetingMutation(meeting.id);
  const cancelMutation = useCancelMeetingApplicationMutation(meeting.id);
  const applicationStatus = meeting.myApplication
    ? getApplicationStatusCopy(meeting.myApplication.displayStatus)
    : null;
  const canCancel = Boolean(meeting.canCancel);
  const isBusy = applyMutation.isPending || cancelMutation.isPending;

  const panelCopy = useMemo(() => {
    if (meeting.myApplication) {
      return {
        title: "신청 상태를 이 패널에서 바로 확인할 수 있어요",
        description: "상세 응답이 돌려준 상태와 결과 안내 문구를 그대로 보여주고, 대기 상태일 때만 취소 액션을 열어 둡니다.",
      };
    }

    if (meeting.canApply) {
      return {
        title: "지금 바로 이 모임에 신청할 수 있어요",
        description: "모집이 열려 있는 동안 한 번에 신청하고, 접수 직후에는 같은 자리에서 상태를 다시 확인할 수 있습니다.",
      };
    }

    return {
      title: "현재는 신청을 진행할 수 없는 상태예요",
      description: "현재 상세 계약이 돌려준 신청 가능 여부를 그대로 반영해 읽기 전용으로 보여줍니다.",
    };
  }, [meeting.canApply, meeting.myApplication]);

  const handleApply = () => {
    setNotice(null);

    applyMutation.mutate(undefined, {
      onSuccess: () => {
        setNotice({
          tone: "success",
          message: "신청이 접수되었습니다. 최신 상태를 다시 불러왔어요.",
        });
      },
      onError: (error) => {
        setNotice({
          tone: "error",
          message: extractApiErrorMessage(error, "신청을 접수하지 못했습니다"),
        });
      },
    });
  };

  const handleCancel = () => {
    if (!meeting.myApplication) {
      return;
    }

    setNotice(null);

    cancelMutation.mutate(meeting.myApplication.id, {
      onSuccess: () => {
        setNotice({
          tone: "success",
          message: "신청을 취소했습니다. 다시 신청할 수 있는지 최신 상태를 확인했어요.",
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

  return (
    <section className="detail-panel-card stack-lg">
      <div className="stack-sm">
        <span className="section-kicker">For Members</span>
        <div className="stack-sm">
          <h2 className="detail-panel-title">{panelCopy.title}</h2>
          <p className="detail-panel-copy">{panelCopy.description}</p>
        </div>
      </div>

      {notice ? (
        <p aria-live="polite" className={`status-banner ${notice.tone === "success" ? "success-banner" : ""}`} role="status">
          {notice.message}
        </p>
      ) : null}

      <div className="panel-action-grid">
        <div className="panel-stat-card stack-sm">
          <span className="summary-label">현재 상태</span>
          <strong>{applicationStatus ? applicationStatus.label : meeting.canApply ? "신청 가능" : "신청 불가"}</strong>
          <p className="meta-copy">
            {meeting.myApplication?.resultMessage ??
              (meeting.canApply
                ? "아직 신청 내역이 없으며, 계약상 현재 신청을 받을 수 있습니다."
                : "상세 응답이 현재 신청 불가 상태를 반환했습니다.")}
          </p>
        </div>

        <div className="panel-stat-card stack-sm">
          <span className="summary-label">진행 가이드</span>
          <strong>{formatAnnouncementDate(meeting.announcementDate)}</strong>
          <p className="meta-copy">
            {canCancel
              ? "대기 상태에서는 취소 후 다시 신청할 수 있습니다."
              : meeting.canApply
                ? "신청 후에는 상세 응답을 다시 받아 상태와 안내 문구를 갱신합니다."
                : "발표 이후 결과 안내 또는 모집 종료 상태를 이 패널에서 그대로 확인합니다."}
          </p>
        </div>
      </div>

      <div className="panel-note stack-sm">
        <span className="meta-copy">신청 액션</span>
        {applicationStatus ? (
          <>
            <span className={`application-status ${applicationStatus.tone}`}>{applicationStatus.label}</span>
            <p className="detail-panel-copy">{meeting.myApplication?.resultMessage ?? "신청 상태를 확인할 수 있습니다."}</p>
            {canCancel ? (
              <div className="panel-action-row">
                <button className="ghost-button" disabled={isBusy} onClick={handleCancel} type="button">
                  {cancelMutation.isPending ? "취소 처리 중..." : "신청 취소하기"}
                </button>
              </div>
            ) : null}
          </>
        ) : meeting.canApply ? (
          <>
            <span className="application-status is-pending">신청 가능</span>
            <p className="detail-panel-copy">모집 기간 안에 있으며 아직 신청 내역이 없습니다. 버튼을 누르면 서버 응답 기준으로 상태를 다시 받아옵니다.</p>
            <div className="panel-action-row">
              <button className="primary-button" disabled={isBusy} onClick={handleApply} type="button">
                {applyMutation.isPending ? "신청 접수 중..." : "이 모임 신청하기"}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="application-status is-rejected">읽기 전용</span>
            <p className="detail-panel-copy">현재는 안내만 제공하며, 상세 응답이 허용하는 범위를 벗어나는 액션은 열지 않습니다.</p>
          </>
        )}
      </div>
    </section>
  );
}
