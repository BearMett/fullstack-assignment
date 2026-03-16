import { AuthTokenDto } from "@packages/shared";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login-request.dto";
import { RegisterRequestDto } from "./dto/register-request.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() payload: RegisterRequestDto): Promise<AuthTokenDto> {
    return this.authService.register(payload);
  }

  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() payload: LoginRequestDto): Promise<AuthTokenDto> {
    return this.authService.login(payload);
  }
}
