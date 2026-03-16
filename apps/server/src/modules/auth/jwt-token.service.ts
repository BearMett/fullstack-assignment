import { UserRole } from "@packages/shared";
import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import { UNAUTHORIZED_MESSAGE } from "./auth.constants";
import { JwtPayload } from "./types/jwt-payload.type";

const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 24;

@Injectable()
export class JwtTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: { userId: number; role: UserRole }): string {
    const now = Math.floor(Date.now() / 1000);

    const jwtPayload: JwtPayload = {
      sub: payload.userId,
      role: payload.role,
      iat: now,
      exp: now + TOKEN_EXPIRES_IN_SECONDS,
    };

    const encodedHeader = this.encodeSegment({ alg: "HS256", typ: "JWT" });
    const encodedPayload = this.encodeSegment(jwtPayload);
    const signature = this.signSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): JwtPayload {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.signSignature(data);

    const incomingBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (incomingBuffer.length !== expectedBuffer.length || !timingSafeEqual(incomingBuffer, expectedBuffer)) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const payload = this.decodePayload(encodedPayload);

    if (
      typeof payload["sub"] !== "number" ||
      !payload["role"] ||
      typeof payload["iat"] !== "number" ||
      typeof payload["exp"] !== "number"
    ) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload["exp"] <= now) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    return {
      sub: payload["sub"],
      role: payload["role"] as UserRole,
      iat: payload["iat"],
      exp: payload["exp"],
    };
  }

  private signSignature(data: string): string {
    const secret = this.getSecret();
    return createHmac("sha256", secret).update(data).digest("base64url");
  }

  private encodeSegment(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  }

  private decodePayload(encodedPayload: string): Record<string, unknown> {
    try {
      return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
  }

  private getSecret(): string {
    const secret = this.configService.get<string>("JWT_SECRET");

    if (!secret) {
      throw new InternalServerErrorException("JWT_SECRET is not configured");
    }

    return secret;
  }
}
