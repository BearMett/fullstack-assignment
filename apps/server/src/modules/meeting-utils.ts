import { ApplicationStatus } from "@packages/shared";

export function isRecruiting(deadline: string): boolean {
  return new Date(deadline) > new Date();
}

export function isAnnouncementPast(announcement: string): boolean {
  return new Date(announcement) <= new Date();
}

export function toResultMessage(displayStatus: ApplicationStatus, isResultVisible: boolean): string {
  if (!isResultVisible) {
    return "발표일에 결과가 공개됩니다";
  }

  if (displayStatus === ApplicationStatus.SELECTED) {
    return "축하합니다! 모임에 선정되었어요";
  }

  if (displayStatus === ApplicationStatus.REJECTED) {
    return "아쉽게도 이번 모임에 함께하지 못했어요";
  }

  return "결과 대기중";
}
