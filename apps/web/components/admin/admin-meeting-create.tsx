"use client";

import { MeetingCategory } from "@packages/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/api-client";
import { getMeetingCategoryLabel } from "@/lib/meeting-presenters";
import { useCreateMeetingMutation } from "@/lib/react-query/use-meetings";

export function AdminMeetingCreate() {
  const router = useRouter();
  const createMutation = useCreateMeetingMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "" as string,
    description: "",
    maxParticipants: "",
    deadline: "",
    announcement: "",
  });

  function kstToUtc(datetimeLocalValue: string): string {
    const kstDate = new Date(datetimeLocalValue + "+09:00");
    return kstDate.toISOString();
  }

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setErrorMessage(null);

    createMutation.mutate(
      {
        title: form.title.trim(),
        category: form.category as MeetingCategory,
        description: form.description.trim(),
        maxParticipants: parseInt(form.maxParticipants, 10),
        deadline: kstToUtc(form.deadline),
        announcement: kstToUtc(form.announcement),
      },
      {
        onSuccess: () => {
          router.push("/admin/meetings");
        },
        onError: (error) => {
          setErrorMessage(extractApiErrorMessage(error, "모임 생성에 실패했습니다"));
        },
      }
    );
  };

  return (
    <main className="page-shell" data-testid="page-shell">
      <div style={{ margin: "0 auto", width: "min(100%, 52rem)" }}>
        <Link
          href="/admin/meetings"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--ink-subtle)", fontSize: "0.9rem", marginBottom: "1rem" }}
        >
          ← 모임 관리로 돌아가기
        </Link>

        <div className="stack-sm" style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.04em" }}>
            새 모임 만들기
          </h1>
          <p className="meta-copy">모임 정보를 입력하고 생성하세요</p>
        </div>

        <section className="auth-card stack-lg" style={{ padding: "1.5rem" }}>
          {errorMessage ? <p className="status-banner">{errorMessage}</p> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-label">모임 제목</span>
              <input
                className="auth-input"
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="예: 3월 독서 모임"
                required
                type="text"
                value={form.title}
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">모임 종류</span>
              <select
                className="auth-input"
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                required
                value={form.category}
                style={{ appearance: "auto" }}
              >
                <option value="">종류 선택</option>
                {Object.values(MeetingCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {getMeetingCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-field">
              <span className="auth-label">설명</span>
              <textarea
                className="auth-input auth-textarea"
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="모임에 대해 상세히 설명해주세요..."
                required
                value={form.description}
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">모집 인원</span>
              <input
                className="auth-input"
                min={1}
                onChange={(e) => setForm((s) => ({ ...s, maxParticipants: e.target.value }))}
                placeholder="최대 인원"
                required
                type="number"
                value={form.maxParticipants}
                style={{ paddingLeft: "2.5rem" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label className="auth-field">
                <span className="auth-label">신청 마감</span>
                <input
                  className="auth-input"
                  onChange={(e) => setForm((s) => ({ ...s, deadline: e.target.value }))}
                  required
                  type="datetime-local"
                  value={form.deadline}
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">결과 발표</span>
                <input
                  className="auth-input"
                  onChange={(e) => setForm((s) => ({ ...s, announcement: e.target.value }))}
                  required
                  type="datetime-local"
                  value={form.announcement}
                />
              </label>
            </div>

            <div
              style={{
                background: "var(--accent-soft)",
                borderRadius: "1rem",
                padding: "1rem",
                fontSize: "0.85rem",
                color: "var(--accent-strong)",
              }}
            >
              <strong>ⓘ 운영 정책 안내</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.8 }}>
                <li>사용자에게는 발표일 이후에만 결과가 노출됩니다.</li>
                <li>모집 인원을 초과하여 선정할 수 없습니다.</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <Link className="ghost-button" href="/admin/meetings">
                취소
              </Link>
              <button className="primary-button" disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? "생성 중..." : "모임 생성"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
