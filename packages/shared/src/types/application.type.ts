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
  motivation?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationResultType extends ApplicationType {
  displayStatus: ApplicationStatus;
  resultMessage?: string;
}
