import { ApplicationStatus } from "@packages/shared";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, Min, ValidateNested } from "class-validator";

export class BatchUpdateApplicationStatusItemRequestDto {
  @IsInt()
  @Min(1)
  applicationId: number;

  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

export class BatchUpdateApplicationStatusRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateApplicationStatusItemRequestDto)
  updates: BatchUpdateApplicationStatusItemRequestDto[];
}
