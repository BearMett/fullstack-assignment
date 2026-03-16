import { UpdateApplicationStatusDto, ApplicationStatus } from "@packages/shared";
import { IsEnum } from "class-validator";

export class UpdateApplicationStatusRequestDto implements UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
