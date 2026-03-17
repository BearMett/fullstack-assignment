import { ApplicationItemDto } from "./application.dto";
import { MeetingCategory } from "../types";

export interface CreateMeetingDto {
  title: string;
  category: MeetingCategory;
  description: string;
  maxParticipants: number;
  deadlineDate: string;
  announcementDate: string;
  allowReapply: boolean;
}

export interface MeetingListItemDto {
  id: number;
  title: string;
  category: MeetingCategory;
  description: string;
  maxParticipants: number;
  deadlineDate: string;
  announcementDate: string;
  allowReapply: boolean;
  isRecruiting: boolean;
  applicantCount: number;
}

export interface MeetingDetailDto extends MeetingListItemDto {
  canApply?: boolean;
  canCancel?: boolean;
  myApplication?: ApplicationItemDto | null;
  selectedCount?: number;
  rejectedCount?: number;
  pendingCount?: number;
}
