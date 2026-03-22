import { CreateMeetingDto, MeetingCategory } from "@packages/shared";
import { IsEnum, IsInt, IsString, Min, MinLength, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { IsFutureDateTime } from "./is-future-datetime.decorator";

@ValidatorConstraint({ name: "isAfterDeadline", async: false })
class IsAfterDeadlineConstraint implements ValidatorConstraintInterface {
  validate(announcement: string, args: ValidationArguments): boolean {
    const obj = args.object as CreateMeetingRequestDto;
    if (!obj.deadline || !announcement) return true;
    return new Date(announcement) > new Date(obj.deadline);
  }

  defaultMessage(): string {
    return "announcement must be after deadline";
  }
}

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
  @Validate(IsAfterDeadlineConstraint)
  announcement: string;

}
