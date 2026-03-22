import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class ListMeetingsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  includeClosed?: boolean;
}
