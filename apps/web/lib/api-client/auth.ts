import { type AuthTokenDto, type SignInDto, type SignUpDto, type UserListItemDto } from "@packages/shared";
import { BaseApiClient } from "./base";

class AuthApiClient extends BaseApiClient {
  async register(payload: SignUpDto): Promise<AuthTokenDto> {
    const response = await this.api.post<AuthTokenDto>("/auth/register", payload);
    return response.data;
  }

  async login(payload: SignInDto): Promise<AuthTokenDto> {
    const response = await this.api.post<AuthTokenDto>("/auth/login", payload);
    return response.data;
  }

  async listUsers(): Promise<UserListItemDto[]> {
    const response = await this.api.get<UserListItemDto[]>("/auth/users");
    return response.data;
  }

  async simpleLogin(userId: number): Promise<AuthTokenDto> {
    const response = await this.api.post<AuthTokenDto>("/auth/simple-login", { userId });
    return response.data;
  }

  async simpleRegister(name: string, phone: string): Promise<AuthTokenDto> {
    const response = await this.api.post<AuthTokenDto>("/auth/simple-register", { name, phone });
    return response.data;
  }
}

export const authApiClient = new AuthApiClient();
