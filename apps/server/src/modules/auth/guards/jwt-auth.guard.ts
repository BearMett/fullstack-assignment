import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtTokenService } from "../jwt-token.service";
import { AuthRequest } from "../types/auth-request.type";
import { UNAUTHORIZED_MESSAGE } from "../auth.constants";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    try {
      const payload = this.jwtTokenService.verify(token);
      request.user = { userId: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
  }

  private extractBearerToken(request: AuthRequest): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
