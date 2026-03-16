import { ApplicationResultType } from "./application.type";

export enum MeetingCategory {
  READING = "READING",
  EXERCISE = "EXERCISE",
  WRITING = "WRITING",
  ENGLISH = "ENGLISH",
}

export interface MeetingType {
  id: number;
  title: string;
  category: MeetingCategory;
  description: string;
  maxParticipants: number;
  announcementDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingSummaryType extends MeetingType {
  isRecruiting: boolean;
  applicantCount: number;
}

export interface MeetingDetailType extends MeetingSummaryType {
  canApply?: boolean;
  canCancel?: boolean;
  myApplication?: ApplicationResultType | null;
  selectedCount?: number;
  rejectedCount?: number;
  pendingCount?: number;
}
