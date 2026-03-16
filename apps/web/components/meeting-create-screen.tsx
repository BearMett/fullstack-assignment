"use client";

import { MeetingCategory, type CreateMeetingDto } from "@packages/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { formatAnnouncementDate, getMeetingCategoryLabel } from "@/lib/meeting-presenters";
import { useCreateMeetingMutation } from "@/lib/react-query/use-meetings";
import { useAuthStore } from "@/lib/store";

type FormState = {
  title: string;
  category: MeetingCategory;
  description: string;
  maxParticipants: string;
  announcementDate: string;
};

const categoryOptions = Object.values(MeetingCategory);

function getTomorrowDateValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function MeetingCreateScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const createMeetingMutation = useCreateMeetingMutation();
  const [formState, setFormState] = useState<FormState>({
    title: "",
    category: MeetingCategory.READING,
    description: "",
    maxParticipants: "8",
    announcementDate: getTomorrowDateValue(),
  });

  const errorMessage = useMemo(() => {
    if (!createMeetingMutation.error) {
      return null;
    }

    return extractApiErrorMessage(createMeetingMutation.error, "모임을 생성하지 못했습니다");
  }, [createMeetingMutation.error]);

  const previewParticipants = Number(formState.maxParticipants || 0);

  const handleChange = <Field extends keyof FormState>(field: Field, value: FormState[Field]) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0]) => {
    event.preventDefault();

    const payload: CreateMeetingDto = {
      title: formState.title.trim(),
      category: formState.category,
      description: formState.description.trim(),
      maxParticipants: Number(formState.maxParticipants),
      announcementDate: formState.announcementDate,
    };

    createMeetingMutation.mutate(payload, {
      onSuccess: (meeting) => {
        router.replace(`/meetings/${meeting.id}`);
      },
    });
  };

  return (
    <main className="page-shell">
      <div className="auth-layout">
        <section className="hero-card stack-lg">
          <span className="section-kicker">For Admin</span>
          <div className="stack-md">
            <h1 className="section-title">새 모임 공지를 한 번에 정리해 열어둘 수 있어요</h1>
            <p className="section-description">
              운영 기준이 되는 제목, 카테고리, 발표일을 같은 흐름에서 입력하고 곧바로 상세 관리 화면으로 이어집니다.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-index">01</span>
              <div className="feature-copy">
                <strong>관리자 계정에서만 생성 폼과 이동 링크를 열어 운영 동선을 분리했습니다.</strong>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-index">02</span>
              <div className="feature-copy">
                <strong>모집 인원과 발표일을 즉시 미리 보며 실수 없이 공지를 확정할 수 있습니다.</strong>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-index">03</span>
              <div className="feature-copy">
                <strong>생성 직후 상세 화면으로 이동해 신청자 관리 패널까지 바로 이어집니다.</strong>
              </div>
            </div>
          </div>

          <div className="meeting-detail-meta-grid">
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">운영자</span>
              <strong>{session?.user.name ?? "관리자"}</strong>
              <p className="meta-copy">현재 세션 권한으로 생성 요청을 보냅니다.</p>
            </div>
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">발표일 미리보기</span>
              <strong>{formatAnnouncementDate(formState.announcementDate)}</strong>
              <p className="meta-copy">서버 검증과 같은 `YYYY-MM-DD` 형식으로 전송합니다.</p>
            </div>
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">카테고리</span>
                <strong>{getMeetingCategoryLabel(formState.category)}</strong>
                <p className="meta-copy">저장값은 영문 enum, 사용자 화면은 한글 라벨로 분리합니다.</p>
            </div>
            <div className="meeting-detail-meta-card stack-sm">
              <span className="summary-label">모집 인원</span>
              <strong>{Number.isFinite(previewParticipants) && previewParticipants > 0 ? `${previewParticipants}명` : "-"}</strong>
              <p className="meta-copy">선정 처리 시 이 숫자를 기준으로 정원이 제한됩니다.</p>
            </div>
          </div>

          <Link className="ghost-link status-link" href="/meetings">
            목록으로 돌아가기
          </Link>
        </section>

        <section className="auth-card stack-lg">
          <div className="auth-header stack-sm">
            <span className="section-kicker">Create</span>
            <div className="stack-sm">
              <h2 className="section-title">새 모임을 등록합니다</h2>
              <p className="section-description">필수 정보만 채우면 즉시 모임 상세와 관리자 패널로 연결됩니다.</p>
            </div>
          </div>

          {errorMessage ? <p className="status-banner">{errorMessage}</p> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-label">모임 제목</span>
              <input
                className="auth-input"
                maxLength={120}
                onChange={(event) => handleChange("title", event.target.value)}
                placeholder="예: 아침 독서 메모 살롱"
                required
                type="text"
                value={formState.title}
              />
            </label>

            <div className="sample-grid">
              <label className="auth-field">
                <span className="auth-label">카테고리</span>
                <select className="auth-input" onChange={(event) => handleChange("category", event.target.value as MeetingCategory)} value={formState.category}>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {getMeetingCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-field">
                <span className="auth-label">모집 인원</span>
                <input
                  className="auth-input"
                  min={1}
                  onChange={(event) => handleChange("maxParticipants", event.target.value)}
                  required
                  type="number"
                  value={formState.maxParticipants}
                />
              </label>
            </div>

            <label className="auth-field">
              <span className="auth-label">모임 설명</span>
              <textarea
                className="auth-input auth-textarea"
                onChange={(event) => handleChange("description", event.target.value)}
                placeholder="운영 목적, 진행 방식, 참가자가 기대할 수 있는 분위기를 적어 주세요"
                required
                value={formState.description}
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">발표일</span>
              <input
                className="auth-input"
                min={getTomorrowDateValue()}
                onChange={(event) => handleChange("announcementDate", event.target.value)}
                required
                type="date"
                value={formState.announcementDate}
              />
            </label>

            <div className="hero-action-row">
              <Link className="ghost-link" href="/meetings">
                취소
              </Link>
              <button className="primary-button" disabled={createMeetingMutation.isPending} type="submit">
                {createMeetingMutation.isPending ? "모임 생성 중..." : "모임 생성하기"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
