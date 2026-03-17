import { IsOptional, IsString } from "class-validator";

export class ApplyRequestDto {
  @IsOptional()
  @IsString()
  motivation?: string;
}
