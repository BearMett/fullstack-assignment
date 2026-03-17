import { SimpleRegisterDto } from "@packages/shared";
import { IsString, MinLength } from "class-validator";

export class SimpleRegisterRequestDto implements SimpleRegisterDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  phone: string;
}
