export enum ApplicationStatus {
  PENDING = "PENDING",
  SELECTED = "SELECTED",
  REJECTED = "REJECTED",
}

export interface ApplicationType {
  id: number;
  userId: number;
  meetingId: number;
  status: ApplicationStatus;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationResultType extends ApplicationType {
  displayStatus: ApplicationStatus;
  resultMessage?: string;
}
