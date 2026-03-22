import { CreateMeetingDto, MeetingCategory } from "@packages/shared";
import { IsEnum, IsInt, IsString, Min, MinLength } from "class-validator";
import { IsFutureDateTime } from "./is-future-datetime.decorator";

export class CreateMeetingRequestDto implements CreateMeetingDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsEnum(MeetingCategory)
  category: MeetingCategory;

  @IsString()
  @MinLength(1)
  description: string;

  @IsInt()
  @Min(1)
  maxParticipants: number;

  @IsFutureDateTime()
  deadline: string;

  @IsFutureDateTime()
  announcement: string;

}
