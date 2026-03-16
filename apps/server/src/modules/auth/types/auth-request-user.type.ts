import { UserRole } from "@packages/shared";

export interface AuthRequestUser {
  userId: number;
  role: UserRole;
}
