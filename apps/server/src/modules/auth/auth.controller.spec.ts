import { UserRole } from "@packages/shared";
import { Controller, Get, INestApplication, Module, UseGuards } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as request from "supertest";
import * as allEntities from "../../entity";
import { User } from "../../entity/user.entity";
import { middleware } from "../app.middleware";
import { AuthModule } from "./auth.module";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Roles } from "./decorators/roles.decorator";
import { AuthRequestUser } from "./types/auth-request-user.type";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtTokenService } from "./jwt-token.service";

@Controller("protected-test")
@UseGuards(JwtAuthGuard, RolesGuard)
class ProtectedTestController {
  @Get("profile")
  profile(@CurrentUser() user: AuthRequestUser) {
    return { id: user.userId, role: user.role };
  }

  @Get("admin")
  @Roles(UserRole.ADMIN)
  adminOnly() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "better-sqlite3",
      database: ":memory:",
      entities: Object.values(allEntities),
      synchronize: true,
      logging: false,
    }),
    AuthModule,
  ],
  controllers: [ProtectedTestController],
  providers: [JwtTokenService, JwtAuthGuard, RolesGuard],
})
class AuthSpecModule {}

describe("AuthController", () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env["JWT_SECRET"] = "test-jwt-secret";

    const moduleRef = await Test.createTestingModule({
      imports: [AuthSpecModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    await middleware(app as NestExpressApplication);
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("registers user and returns { user, token } with role=user", async () => {
    const response = await request(app.getHttpServer()).post("/api/auth/register").send({
      email: "register@example.com",
      password: "Password1!",
      name: "홍길동",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("register@example.com");
    expect(response.body.user.role).toBe(UserRole.USER);
    expect(typeof response.body.token).toBe("string");
  });

  it("rejects duplicate register email with 409", async () => {
    await request(app.getHttpServer()).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "Password1!",
      name: "중복",
    });

    const response = await request(app.getHttpServer()).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "Password1!",
      name: "중복2",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("이미 사용 중인 이메일입니다");
  });

  it("logs in user and admin accounts", async () => {
    await request(app.getHttpServer()).post("/api/auth/register").send({
      email: "login@example.com",
      password: "Password1!",
      name: "로그인",
    });

    const userLoginResponse = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "login@example.com",
      password: "Password1!",
    });

    expect(userLoginResponse.status).toBe(200);
    expect(userLoginResponse.body.user.role).toBe(UserRole.USER);
    expect(typeof userLoginResponse.body.token).toBe("string");

    const userRepository = app.get(getRepositoryToken(User));
    await userRepository.update({ email: "login@example.com" }, { role: UserRole.ADMIN });

    const adminLoginResponse = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "login@example.com",
      password: "Password1!",
    });

    expect(adminLoginResponse.status).toBe(200);
    expect(adminLoginResponse.body.user.role).toBe(UserRole.ADMIN);
  });

  it("returns unified 401 for bad credentials", async () => {
    await request(app.getHttpServer()).post("/api/auth/register").send({
      email: "known@example.com",
      password: "Password1!",
      name: "known",
    });

    const wrongPasswordResponse = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "known@example.com",
      password: "WrongPassword1!",
    });

    const unknownEmailResponse = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "Password1!",
    });

    expect(wrongPasswordResponse.status).toBe(401);
    expect(unknownEmailResponse.status).toBe(401);
    expect(wrongPasswordResponse.body.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다");
    expect(unknownEmailResponse.body.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다");
  });

  it("returns 401 for missing or invalid JWT", async () => {
    const noTokenResponse = await request(app.getHttpServer()).get("/api/protected-test/profile");
    const invalidTokenResponse = await request(app.getHttpServer())
      .get("/api/protected-test/profile")
      .set("Authorization", "Bearer invalid.token.value");

    expect(noTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.status).toBe(401);
  });

  it("returns 403 when non-admin accesses admin-only route", async () => {
    const registerResponse = await request(app.getHttpServer()).post("/api/auth/register").send({
      email: "role-user@example.com",
      password: "Password1!",
      name: "권한",
    });

    const response = await request(app.getHttpServer())
      .get("/api/protected-test/admin")
      .set("Authorization", `Bearer ${registerResponse.body.token}`);

    expect(response.status).toBe(403);
  });
});
