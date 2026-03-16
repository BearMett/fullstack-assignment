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
  userName?: string;
  userEmail?: string;
  resultMessage?: string;
  createdAt: string;
  updatedAt: string;
}
