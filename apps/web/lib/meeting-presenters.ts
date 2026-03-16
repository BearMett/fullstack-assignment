import { ApplicationStatus } from "@packages/shared";
import { MeetingCategory } from "@packages/shared";

const meetingCategoryLabels: Record<MeetingCategory, string> = {
  [MeetingCategory.READING]: "독서",
  [MeetingCategory.EXERCISE]: "운동",
  [MeetingCategory.WRITING]: "기록",
  [MeetingCategory.ENGLISH]: "영어",
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

export function getRecruitingStateCopy(isRecruiting: boolean): {
  label: string;
  description: string;
  tone: "is-open" | "is-closed";
} {
  if (isRecruiting) {
    return {
      label: "모집 중",
      description: "발표일 전까지 신청을 받을 수 있는 상태입니다.",
      tone: "is-open",
    };
  }

  return {
    label: "모집 마감",
    description: "발표일이 도래해 더 이상 신규 신청을 받지 않습니다.",
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
