import { SignUpDto } from "@packages/shared";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterRequestDto implements SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;
}
