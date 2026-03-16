import { type AuthTokenDto, type SignInDto, type SignUpDto } from "@packages/shared";
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
}

export const authApiClient = new AuthApiClient();
