import { SimpleRegisterDto } from "@packages/shared";
import { IsOptional, IsString, MinLength } from "class-validator";

export class SimpleRegisterRequestDto implements SimpleRegisterDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
