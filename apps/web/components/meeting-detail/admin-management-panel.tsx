"use client";

import { ApplicationStatus, type ApplicationItemDto, type MeetingDetailDto } from "@packages/shared";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { getApplicationStatusCopy } from "@/lib/meeting-presenters";
import {
  useBatchUpdateMeetingApplicationStatusMutation,
  useMeetingApplicantsQuery,
  useUpdateMeetingApplicationStatusMutation,
} from "@/lib/react-query/use-meeting-applications";

type AdminManagementPanelProps = {
  meeting: MeetingDetailDto;
};

type PanelNotice = {
  tone: "success" | "error";
  message: string;
};

const EMPTY_APPLICANTS: ApplicationItemDto[] = [];

const applicantDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatApplicantDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return applicantDateFormatter.format(date);
}

function ApplicantRow({
  applicant,
  checked,
  disabled,
  onToggle,
  onAction,
}: {
  applicant: ApplicationItemDto;
  checked: boolean;
  disabled: boolean;
  onToggle: (applicationId: number, checked: boolean) => void;
  onAction: (applicationId: number, status: ApplicationStatus) => void;
}) {
  const statusCopy = getApplicationStatusCopy(applicant.displayStatus);

  return (
    <article className="admin-applicant-card stack-md">
      <div className="admin-applicant-head">
        <label className="admin-check-label">
          <input
            checked={checked}
            className="admin-check"
            disabled={disabled}
            onChange={(event) => onToggle(applicant.id, event.target.checked)}
            type="checkbox"
          />
          <span className="admin-check-copy stack-sm">
            <strong>신청 #{applicant.id}</strong>
            <span className="meta-copy">
              {applicant.userName ? `${applicant.userName} · ${applicant.userEmail ?? `회원 #${applicant.userId}`}` : `회원 #${applicant.userId}`}
            </span>
          </span>
        </label>

        <span className={`application-status ${statusCopy.tone}`}>{statusCopy.label}</span>
      </div>

      <div className="admin-applicant-meta">
        <div className="stack-sm">
          <span className="summary-label">접수 시각</span>
          <strong>{formatApplicantDate(applicant.createdAt)}</strong>
        </div>
        <div className="stack-sm">
          <span className="summary-label">관리 기준</span>
          <strong>{applicant.status}</strong>
        </div>
      </div>

      <div className="admin-inline-actions">
        <button
          className="ghost-button"
          disabled={disabled || applicant.status === ApplicationStatus.SELECTED}
          onClick={() => onAction(applicant.id, ApplicationStatus.SELECTED)}
          type="button"
        >
          선정
        </button>
        <button
          className="ghost-button"
          disabled={disabled || applicant.status === ApplicationStatus.REJECTED}
          onClick={() => onAction(applicant.id, ApplicationStatus.REJECTED)}
          type="button"
        >
          미선정
        </button>
      </div>
    </article>
  );
}

export function AdminManagementPanel({ meeting }: AdminManagementPanelProps) {
  const applicantsQuery = useMeetingApplicantsQuery(meeting.id);
  const updateStatusMutation = useUpdateMeetingApplicationStatusMutation(meeting.id);
  const batchUpdateMutation = useBatchUpdateMeetingApplicationStatusMutation(meeting.id);
  const [rawSelectedIds, setRawSelectedIds] = useState<number[]>([]);
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const applicants = applicantsQuery.data ?? EMPTY_APPLICANTS;
  const isBusy = updateStatusMutation.isPending || batchUpdateMutation.isPending;

  const stats = [
    {
      label: "선정",
      value: meeting.selectedCount ?? 0,
    },
    {
      label: "대기",
      value: meeting.pendingCount ?? 0,
    },
    {
      label: "미선정",
      value: meeting.rejectedCount ?? 0,
    },
  ];

  const selectedIds = useMemo(
    () => rawSelectedIds.filter((applicationId) => applicants.some((applicant) => applicant.id === applicationId)),
    [applicants, rawSelectedIds]
  );
  const allSelected = applicants.length > 0 && selectedIds.length === applicants.length;
  const selectedApplicants = useMemo(
    () => applicants.filter((applicant) => selectedIds.includes(applicant.id)),
    [applicants, selectedIds]
  );

  const selectedSummary = useMemo(() => {
    const selectedCount = selectedApplicants.filter((applicant) => applicant.status === ApplicationStatus.SELECTED).length;
    const rejectedCount = selectedApplicants.filter((applicant) => applicant.status === ApplicationStatus.REJECTED).length;
    const pendingCount = selectedApplicants.length - selectedCount - rejectedCount;

    return { selectedCount, rejectedCount, pendingCount };
  }, [selectedApplicants]);

  const handleToggle = (applicationId: number, checked: boolean) => {
    setRawSelectedIds((current) => {
      if (checked) {
        return current.includes(applicationId) ? current : [...current, applicationId];
      }

      return current.filter((id) => id !== applicationId);
    });
  };

  const handleToggleAll = () => {
    setRawSelectedIds(allSelected ? [] : applicants.map((applicant) => applicant.id));
  };

  const handleSingleAction = (applicationId: number, status: ApplicationStatus) => {
    setNotice(null);

    updateStatusMutation.mutate(
      { applicationId, status },
      {
        onSuccess: () => {
          setNotice({
            tone: "success",
            message: status === ApplicationStatus.SELECTED ? "개별 신청자를 선정했습니다." : "개별 신청자를 미선정 처리했습니다.",
          });
        },
        onError: (error) => {
          setNotice({
            tone: "error",
            message: extractApiErrorMessage(error, "신청 상태를 변경하지 못했습니다"),
          });
        },
      }
    );
  };

  const handleBatchAction = (status: ApplicationStatus) => {
    if (selectedIds.length === 0) {
      return;
    }

    setNotice(null);

    batchUpdateMutation.mutate(
      {
        updates: selectedIds.map((applicationId) => ({ applicationId, status })),
      },
      {
        onSuccess: () => {
          setRawSelectedIds([]);
          setNotice({
            tone: "success",
            message:
              status === ApplicationStatus.SELECTED
                ? `선택한 ${selectedIds.length}건을 한 번에 선정했습니다.`
                : `선택한 ${selectedIds.length}건을 한 번에 미선정 처리했습니다.`,
          });
        },
        onError: (error) => {
          setNotice({
            tone: "error",
            message: extractApiErrorMessage(error, "선택한 신청 상태를 일괄 변경하지 못했습니다"),
          });
        },
      }
    );
  };

  return (
    <section className="detail-panel-card stack-lg">
      <div className="stack-sm">
        <span className="section-kicker">For Admin</span>
        <div className="stack-sm">
          <h2 className="detail-panel-title">신청자 목록을 보며 선정과 미선정을 바로 처리할 수 있어요</h2>
          <p className="detail-panel-copy">
            상세 패널의 위치와 구조는 그대로 유지하고, 같은 자리에서 개별 처리와 일괄 처리를 모두 열었습니다.
          </p>
        </div>
      </div>

      {notice ? (
        <p aria-live="polite" className={`status-banner ${notice.tone === "success" ? "success-banner" : ""}`} role="status">
          {notice.message}
        </p>
      ) : null}

      <div className="panel-stat-grid">
        {stats.map((stat) => (
          <div className="panel-stat-card stack-sm" key={stat.label}>
            <span className="summary-label">{stat.label}</span>
            <strong className="panel-stat-value">{stat.value}</strong>
          </div>
        ))}
      </div>

      <section className="panel-stat-card stack-md">
        <div className="admin-batch-head">
          <div className="stack-sm">
            <span className="summary-label">일괄 처리</span>
            <strong>{selectedIds.length > 0 ? `${selectedIds.length}건 선택됨` : "선택된 신청 없음"}</strong>
            <p className="meta-copy">
              현재 선택한 신청 중 선정 {selectedSummary.selectedCount}건, 대기 {selectedSummary.pendingCount}건, 미선정 {selectedSummary.rejectedCount}건
            </p>
          </div>

          <button className="ghost-button" disabled={isBusy || applicants.length === 0} onClick={handleToggleAll} type="button">
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
        </div>

        <div className="panel-action-grid">
          <button
            className="primary-button"
            disabled={isBusy || selectedIds.length === 0}
            onClick={() => handleBatchAction(ApplicationStatus.SELECTED)}
            type="button"
          >
            {batchUpdateMutation.isPending ? "일괄 처리 중..." : "선택 항목 선정"}
          </button>
          <button
            className="ghost-button"
            disabled={isBusy || selectedIds.length === 0}
            onClick={() => handleBatchAction(ApplicationStatus.REJECTED)}
            type="button"
          >
            선택 항목 미선정
          </button>
        </div>
      </section>

      <div className="stack-md">
        <div className="admin-list-head">
          <span className="summary-label">신청자 목록</span>
          <span className="meta-copy">접수 순서대로 정렬했습니다.</span>
        </div>

        {applicantsQuery.isLoading ? (
          <div className="admin-applicant-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="panel-stat-card stack-sm" key={`applicant-loading-${index}`}>
                <div className="loading-block loading-copy short" />
                <div className="loading-block loading-copy" />
                <div className="loading-block loading-copy short" />
              </div>
            ))}
          </div>
        ) : null}

        {applicantsQuery.isError ? (
          <div className="panel-stat-card stack-sm">
            <strong>신청자 목록을 불러오지 못했습니다</strong>
            <p className="meta-copy">{extractApiErrorMessage(applicantsQuery.error, "잠시 후 다시 시도해 주세요")}</p>
          </div>
        ) : null}

        {!applicantsQuery.isLoading && !applicantsQuery.isError && applicants.length === 0 ? (
          <div className="panel-stat-card stack-sm">
            <strong>아직 접수된 신청이 없습니다</strong>
            <p className="meta-copy">신청이 들어오면 이 패널에서 바로 선택과 정리 작업을 이어갈 수 있습니다.</p>
          </div>
        ) : null}

        {!applicantsQuery.isLoading && !applicantsQuery.isError && applicants.length > 0 ? (
          <div className="admin-applicant-list">
            {applicants.map((applicant) => (
              <ApplicantRow
                applicant={applicant}
                checked={selectedIds.includes(applicant.id)}
                disabled={isBusy}
                key={applicant.id}
                onAction={handleSingleAction}
                onToggle={handleToggle}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
