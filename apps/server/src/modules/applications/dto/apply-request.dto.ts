import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApplyRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivation?: string;
}
