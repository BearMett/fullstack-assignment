export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface UserType {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
