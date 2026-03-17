import { SimpleLoginDto } from "@packages/shared";
import { IsInt } from "class-validator";

export class SimpleLoginRequestDto implements SimpleLoginDto {
  @IsInt()
  userId: number;
}
