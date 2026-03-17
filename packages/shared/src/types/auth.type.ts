export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface UserType {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
