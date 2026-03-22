import { describe, it, expect, vi, afterEach } from "vitest";
import { ApplicationStatus, MeetingCategory } from "@packages/shared";
import {
  formatDateTimeFull,
  formatDateTimeShort,
  getRelativeDateLabel,
  getRecruitingStateCopy,
  getApplicationStatusCopy,
  getMeetingCategoryLabel,
  getMeetingCategoryIcon,
  getMeetingStatusBadges,
} from "../meeting-presenters";

describe("formatDateTimeFull", () => {
  it("유효한 ISO 문자열을 한국어 전체 날짜로 포맷한다", () => {
    // 2024-03-15T09:30:00Z → KST 18:30
    const result = formatDateTimeFull("2024-03-15T09:30:00Z");
    expect(result).toContain("3월");
    expect(result).toContain("15일");
  });

  it("유효하지 않은 문자열은 그대로 반환한다", () => {
    expect(formatDateTimeFull("invalid")).toBe("invalid");
  });

  it("정오(오후 12:00)를 '정오'로 변환한다", () => {
    // KST noon = UTC 03:00
    const result = formatDateTimeFull("2024-06-01T03:00:00Z");
    expect(result).toContain("정오");
    expect(result).not.toContain("오후 12:00");
  });

  it("자정(오전 12:00)을 '자정'으로 변환한다", () => {
    // KST midnight = UTC 15:00 (previous day)
    const result = formatDateTimeFull("2024-05-31T15:00:00Z");
    expect(result).toContain("자정");
    expect(result).not.toContain("오전 12:00");
  });
});

describe("formatDateTimeShort", () => {
  it("유효한 ISO 문자열을 짧은 날짜로 포맷한다", () => {
    const result = formatDateTimeShort("2024-03-15T09:30:00Z");
    expect(result).toMatch(/3\.\s*15\./);
  });

  it("유효하지 않은 문자열은 그대로 반환한다", () => {
    expect(formatDateTimeShort("bad-date")).toBe("bad-date");
  });
});

describe("getRelativeDateLabel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("과거 날짜는 빈 문자열을 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    expect(getRelativeDateLabel("2024-06-15T11:00:00Z")).toBe("");
  });

  it("1시간 미만이면 '곧'을 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    // 20분 후 → Math.round(20/60) = 0 → "곧"
    expect(getRelativeDateLabel("2024-06-15T12:20:00Z")).toBe("곧");
  });

  it("1~23시간이면 'N시간 후'를 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    expect(getRelativeDateLabel("2024-06-15T17:00:00Z")).toBe("5시간 후");
  });

  it("23시간 경계에서도 'N시간 후'를 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    // 18시간 후 — diffHours < 24 분기를 12 미만으로 변형하면 잡히는 mutant
    expect(getRelativeDateLabel("2024-06-16T06:00:00Z")).toBe("18시간 후");
    // 23시간 후 — 실제 24시간 경계 직전 값
    expect(getRelativeDateLabel("2024-06-16T11:00:00Z")).toBe("23시간 후");
  });

  it("24시간 이상이면 'D-N'을 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    // 정확히 24시간 → Math.round(24) = 24, diffHours < 24 false → D-1
    expect(getRelativeDateLabel("2024-06-16T12:00:00Z")).toBe("D-1");
    expect(getRelativeDateLabel("2024-06-18T12:00:00Z")).toBe("D-3");
  });

  it("유효하지 않은 날짜는 빈 문자열을 반환한다", () => {
    expect(getRelativeDateLabel("not-a-date")).toBe("");
  });
});

describe("getRecruitingStateCopy", () => {
  it("모집 중일 때 올바른 라벨과 tone을 반환한다", () => {
    const result = getRecruitingStateCopy(true);
    expect(result.label).toBe("모집 중");
    expect(result.tone).toBe("is-open");
  });

  it("모집 마감일 때 올바른 라벨과 tone을 반환한다", () => {
    const result = getRecruitingStateCopy(false);
    expect(result.label).toBe("모집 마감");
    expect(result.tone).toBe("is-closed");
  });
});

describe("getApplicationStatusCopy", () => {
  it("SELECTED → 선정 / is-selected", () => {
    const result = getApplicationStatusCopy(ApplicationStatus.SELECTED);
    expect(result).toEqual({ label: "선정", tone: "is-selected" });
  });

  it("REJECTED → 미선정 / is-rejected", () => {
    const result = getApplicationStatusCopy(ApplicationStatus.REJECTED);
    expect(result).toEqual({ label: "미선정", tone: "is-rejected" });
  });

  it("PENDING → 대기 중 / is-pending", () => {
    const result = getApplicationStatusCopy(ApplicationStatus.PENDING);
    expect(result).toEqual({ label: "대기 중", tone: "is-pending" });
  });
});

describe("getMeetingCategoryLabel", () => {
  it("각 카테고리에 대해 올바른 한글 라벨을 반환한다", () => {
    expect(getMeetingCategoryLabel(MeetingCategory.READING)).toBe("독서");
    expect(getMeetingCategoryLabel(MeetingCategory.EXERCISE)).toBe("운동");
    expect(getMeetingCategoryLabel(MeetingCategory.WRITING)).toBe("기록");
    expect(getMeetingCategoryLabel(MeetingCategory.ENGLISH)).toBe("영어");
  });
});

describe("getMeetingCategoryIcon", () => {
  it("각 카테고리에 대해 올바른 아이콘을 반환한다", () => {
    expect(getMeetingCategoryIcon(MeetingCategory.READING)).toBe("📖");
    expect(getMeetingCategoryIcon(MeetingCategory.EXERCISE)).toBe("🏃");
    expect(getMeetingCategoryIcon(MeetingCategory.WRITING)).toBe("✏️");
    expect(getMeetingCategoryIcon(MeetingCategory.ENGLISH)).toBe("🌐");
  });
});

describe("getMeetingStatusBadges", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("항상 카테고리 배지를 포함한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));

    const badges = getMeetingStatusBadges({
      category: MeetingCategory.READING,
      isRecruiting: false,
      announcement: "2025-01-01T00:00:00Z",
    });

    expect(badges[0]).toEqual({
      label: "📖 독서",
      tone: "category",
    });
  });

  it("모집 중이면 '모집 중' 배지를 포함한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));

    const badges = getMeetingStatusBadges({
      category: MeetingCategory.EXERCISE,
      isRecruiting: true,
      announcement: "2025-01-01T00:00:00Z",
    });

    expect(badges).toContainEqual({ label: "모집 중", tone: "is-open" });
  });

  it("발표일이 과거면 '발표 완료' 배지를 포함한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));

    const badges = getMeetingStatusBadges({
      category: MeetingCategory.WRITING,
      isRecruiting: false,
      announcement: "2024-06-14T00:00:00Z",
    });

    expect(badges).toContainEqual({ label: "발표 완료", tone: "is-closed" });
  });

  it("발표일이 미래면 '발표 완료' 배지를 포함하지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));

    const badges = getMeetingStatusBadges({
      category: MeetingCategory.ENGLISH,
      isRecruiting: false,
      announcement: "2024-06-20T00:00:00Z",
    });

    expect(badges).not.toContainEqual(
      expect.objectContaining({ label: "발표 완료" })
    );
  });
});
