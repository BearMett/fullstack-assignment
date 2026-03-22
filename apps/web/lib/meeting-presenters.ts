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

const announcementDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatAnnouncementDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return announcementDateFormatter.format(date);
}

export function getRelativeDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays === -1) return "어제";
  if (diffDays > 1) return `D-${diffDays}`;
  return `${Math.abs(diffDays)}일 전`;
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
  announcementDate: string;
}, options?: { isAdmin?: boolean }): MeetingBadge[] {
  const badges: MeetingBadge[] = [];

  badges.push({
    label: `${getMeetingCategoryIcon(meeting.category)} ${getMeetingCategoryLabel(meeting.category)}`,
    tone: "category",
  });

  const today = new Date().toISOString().slice(0, 10);
  const isAnnouncementPast = meeting.announcementDate <= today;

  if (isAnnouncementPast) {
    badges.push({ label: "발표 완료", tone: "is-closed" });
  }

  return badges;
}
