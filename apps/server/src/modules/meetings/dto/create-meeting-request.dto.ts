import { CreateMeetingDto, MeetingCategory } from "@packages/shared";
import { IsEnum, IsInt, IsString, Matches, Min, MinLength } from "class-validator";
import { IsFutureDateString } from "./is-future-date-string.decorator";

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

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsFutureDateString()
  announcementDate: string;
}
