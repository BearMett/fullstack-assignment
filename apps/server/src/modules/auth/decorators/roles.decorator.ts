import { UserRole } from "@packages/shared";
import { SetMetadata } from "@nestjs/common";

export const ROLE_METADATA_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_METADATA_KEY, roles);
