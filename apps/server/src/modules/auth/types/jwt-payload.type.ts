import { UserRole } from "@packages/shared";

export interface JwtPayload {
  sub: number;
  role: UserRole;
  iat: number;
  exp: number;
}
