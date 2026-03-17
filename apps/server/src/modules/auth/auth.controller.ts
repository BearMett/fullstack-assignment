import { AuthTokenDto, UserListItemDto } from "@packages/shared";
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login-request.dto";
import { RegisterRequestDto } from "./dto/register-request.dto";
import { SimpleLoginRequestDto } from "./dto/simple-login-request.dto";
import { SimpleRegisterRequestDto } from "./dto/simple-register-request.dto";

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

  @Get("users")
  async listUsers(): Promise<UserListItemDto[]> {
    return this.authService.listUsers();
  }

  @HttpCode(HttpStatus.OK)
  @Post("simple-login")
  async simpleLogin(@Body() payload: SimpleLoginRequestDto): Promise<AuthTokenDto> {
    return this.authService.simpleLogin(payload.userId);
  }

  @Post("simple-register")
  async simpleRegister(@Body() payload: SimpleRegisterRequestDto): Promise<AuthTokenDto> {
    return this.authService.simpleRegister(payload.name, payload.phone);
  }
}
