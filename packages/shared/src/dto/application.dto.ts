import { ApplicationStatus } from "../types";

export interface CreateApplicationDto {
  meetingId: number;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
}

export interface BatchUpdateApplicationStatusItemDto {
  applicationId: number;
  status: ApplicationStatus;
}

export interface BatchUpdateApplicationStatusDto {
  updates: BatchUpdateApplicationStatusItemDto[];
}

export interface ApplicationItemDto {
  id: number;
  userId: number;
  meetingId: number;
  status: ApplicationStatus;
  displayStatus: ApplicationStatus;
  motivation?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  resultMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyToMeetingDto {
  motivation?: string;
}

export interface MyApplicationItemDto {
  id: number;
  meetingId: number;
  meetingTitle: string;
  meetingCategory: string;
  announcement: string;
  status: ApplicationStatus;
  displayStatus: ApplicationStatus;
  resultMessage?: string;
  createdAt: string;
}
