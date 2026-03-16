import { SignInDto } from "@packages/shared";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginRequestDto implements SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
