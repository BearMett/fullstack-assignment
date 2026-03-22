import { ApplicationStatus } from "@packages/shared";
import { MeetingCategory } from "@packages/shared";

const meetingCategoryLabels: Record<MeetingCategory, string> = {
  [MeetingCategory.READING]: "독서",
  [MeetingCategory.EXERCISE]: "운동",
  [MeetingCategory.WRITING]: "기록",
  [MeetingCategory.ENGLISH]: "영어",
};

const meetingCategoryIcons: Record<MeetingCategory, string> = {
  [MeetingCategory.READING]: "📖",
  [MeetingCategory.EXERCISE]: "🏃",
  [MeetingCategory.WRITING]: "✏️",
  [MeetingCategory.ENGLISH]: "🌐",
};

const DISPLAY_TIMEZONE = "Asia/Seoul";

const fullDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: DISPLAY_TIMEZONE,
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: DISPLAY_TIMEZONE,
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function replaceNoonMidnight(formatted: string): string {
  return formatted
    .replace(/오전 12:00/, "자정")
    .replace(/오후 12:00/, "정오");
}

export function formatDateTimeFull(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return replaceNoonMidnight(fullDateTimeFormatter.format(date));
}

export function formatDateTimeShort(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return replaceNoonMidnight(shortDateTimeFormatter.format(date));
}

export function getRelativeDateLabel(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);

  if (Number.isNaN(target.getTime())) return "";

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return "";

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "곧";
  if (diffHours < 24) return `${diffHours}시간 후`;
  return `D-${diffDays}`;
}

export function getRecruitingStateCopy(isRecruiting: boolean): {
  label: string;
  description: string;
  tone: "is-open" | "is-closed";
} {
  if (isRecruiting) {
    return {
      label: "모집 중",
      description: "마감일 전까지 신청을 받을 수 있는 상태입니다.",
      tone: "is-open",
    };
  }

  return {
    label: "모집 마감",
    description: "마감일이 지나 더 이상 신규 신청을 받지 않습니다.",
    tone: "is-closed",
  };
}

export function getApplicationStatusCopy(status: ApplicationStatus): {
  label: string;
  tone: "is-selected" | "is-pending" | "is-rejected";
} {
  if (status === ApplicationStatus.SELECTED) {
    return {
      label: "선정",
      tone: "is-selected",
    };
  }

  if (status === ApplicationStatus.REJECTED) {
    return {
      label: "미선정",
      tone: "is-rejected",
    };
  }

  return {
    label: "대기 중",
    tone: "is-pending",
  };
}

export function getMeetingCategoryLabel(category: MeetingCategory): string {
  return meetingCategoryLabels[category] ?? category;
}

export function getMeetingCategoryIcon(category: MeetingCategory): string {
  return meetingCategoryIcons[category] ?? "📋";
}

type MeetingBadge = {
  label: string;
  tone: string;
};

export function getMeetingStatusBadges(meeting: {
  category: MeetingCategory;
  isRecruiting: boolean;
  announcement: string;
}, options?: { isAdmin?: boolean }): MeetingBadge[] {
  const badges: MeetingBadge[] = [];

  badges.push({
    label: `${getMeetingCategoryIcon(meeting.category)} ${getMeetingCategoryLabel(meeting.category)}`,
    tone: "category",
  });

  const isAnnouncementPast = new Date(meeting.announcement) <= new Date();

  if (isAnnouncementPast) {
    badges.push({ label: "발표 완료", tone: "is-closed" });
  }

  return badges;
}
