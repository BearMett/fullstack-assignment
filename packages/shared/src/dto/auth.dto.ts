import { UserRole } from "../types";

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthTokenDto {
  token: string;
  user: AuthUserDto;
}
