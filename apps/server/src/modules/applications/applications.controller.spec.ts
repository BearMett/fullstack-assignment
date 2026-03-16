import { ApplicationStatus, MeetingCategory, UserRole } from "@packages/shared";
import { Controller, INestApplication, Module, UseGuards } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { NestExpressApplication } from "@nestjs/platform-express";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as request from "supertest";
import * as allEntities from "../../entity";
import { Application, Meeting, User } from "../../entity";
import { middleware } from "../app.middleware";
import { AuthModule } from "../auth/auth.module";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { JwtTokenService } from "../auth/jwt-token.service";
import { ApplicationsModule } from "./applications.module";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
class TestAuthController {}

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
    TypeOrmModule.forFeature([Meeting, Application, User]),
    AuthModule,
    ApplicationsModule,
  ],
  controllers: [TestAuthController],
  providers: [JwtTokenService, JwtAuthGuard, RolesGuard],
})
class ApplicationsSpecModule {}

describe("ApplicationsController", () => {
  let app: INestApplication;
  let meetingRepository: Repository<Meeting>;
  let applicationRepository: Repository<Application>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    process.env["JWT_SECRET"] = "test-jwt-secret";

    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationsSpecModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    await middleware(app as NestExpressApplication);
    await app.init();

    meetingRepository = app.get(getRepositoryToken(Meeting));
    applicationRepository = app.get(getRepositoryToken(Application));
    userRepository = app.get(getRepositoryToken(User));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("POST /api/meetings/:meetingId/applications applies once per user when recruiting", async () => {
    const userToken = await registerAndLogin("apply-user@example.com", "신청유저");
    const meeting = await createMeeting(10, 1);

    const applyResponse = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.meetingId).toBe(meeting.id);
    expect(applyResponse.body.status).toBe(ApplicationStatus.PENDING);

    const duplicateApplyResponse = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(duplicateApplyResponse.status).toBe(409);
  });

  it("POST /api/meetings/:meetingId/applications blocks unauthenticated and closed recruiting", async () => {
    const meeting = await createMeeting(10, -1);

    const noAuthResponse = await request(app.getHttpServer()).post(`/api/meetings/${meeting.id}/applications`).send();
    expect(noAuthResponse.status).toBe(401);

    const userToken = await registerAndLogin("closed-user@example.com", "모집마감");
    const closedResponse = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(closedResponse.status).toBe(400);
  });

  it("DELETE /api/meetings/:meetingId/applications/:applicationId only deletes caller pending application and allows reapply", async () => {
    const userToken = await registerAndLogin("cancel-user@example.com", "취소유저");
    const meeting = await createMeeting(10, 1);

    const applied = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/meetings/${meeting.id}/applications/${applied.body.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(deleteResponse.status).toBe(200);

    const reapplied = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(reapplied.status).toBe(201);

    const otherToken = await registerAndLogin("other-user@example.com", "다른유저");
    const forbiddenDelete = await request(app.getHttpServer())
      .delete(`/api/meetings/${meeting.id}/applications/${reapplied.body.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send();

    expect(forbiddenDelete.status).toBe(403);
  });

  it("DELETE /api/meetings/:meetingId/applications/:applicationId rejects non-pending cancellation", async () => {
    const adminToken = await registerAndLogin("admin-cancel@example.com", "관리자", UserRole.ADMIN);
    const userToken = await registerAndLogin("selected-user@example.com", "선정유저");
    const meeting = await createMeeting(1, 1);

    const applied = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    await request(app.getHttpServer())
      .patch(`/api/admin/meetings/${meeting.id}/applications/${applied.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: ApplicationStatus.SELECTED });

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/meetings/${meeting.id}/applications/${applied.body.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(deleteResponse.status).toBe(400);
  });

  it("GET /api/admin/meetings/:meetingId/applications lists applicants for admin only", async () => {
    const adminToken = await registerAndLogin("admin-list@example.com", "관리자", UserRole.ADMIN);
    const userToken = await registerAndLogin("user-list@example.com", "사용자");
    const meeting = await createMeeting(10, 1);

    await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    const forbidden = await request(app.getHttpServer())
      .get(`/api/admin/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userToken}`)
      .send();

    expect(forbidden.status).toBe(403);

    const listResponse = await request(app.getHttpServer())
      .get(`/api/admin/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send();

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBe(1);
    expect(listResponse.body[0].status).toBe(ApplicationStatus.PENDING);
  });

  it("PATCH /api/admin/meetings/:meetingId/applications/:applicationId/status changes to selected and rejected", async () => {
    const adminToken = await registerAndLogin("admin-single@example.com", "관리자", UserRole.ADMIN);
    const selectedUserToken = await registerAndLogin("selected-single@example.com", "선정대상");
    const rejectedUserToken = await registerAndLogin("rejected-single@example.com", "탈락대상");
    const meeting = await createMeeting(1, 1);

    const selectedCandidate = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${selectedUserToken}`)
      .send();

    const rejectedCandidate = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${rejectedUserToken}`)
      .send();

    const selectedResponse = await request(app.getHttpServer())
      .patch(`/api/admin/meetings/${meeting.id}/applications/${selectedCandidate.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: ApplicationStatus.SELECTED });

    expect(selectedResponse.status).toBe(200);
    expect(selectedResponse.body.status).toBe(ApplicationStatus.SELECTED);

    const rejectedResponse = await request(app.getHttpServer())
      .patch(`/api/admin/meetings/${meeting.id}/applications/${rejectedCandidate.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: ApplicationStatus.REJECTED });

    expect(rejectedResponse.status).toBe(200);
    expect(rejectedResponse.body.status).toBe(ApplicationStatus.REJECTED);
  });

  it("PATCH /api/admin/meetings/:meetingId/applications/status rejects overflow with rollback", async () => {
    const adminToken = await registerAndLogin("admin-batch@example.com", "관리자", UserRole.ADMIN);
    const userTokenA = await registerAndLogin("batch-a@example.com", "배치A");
    const userTokenB = await registerAndLogin("batch-b@example.com", "배치B");
    const meeting = await createMeeting(1, 1);

    const candidateA = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userTokenA}`)
      .send();
    const candidateB = await request(app.getHttpServer())
      .post(`/api/meetings/${meeting.id}/applications`)
      .set("Authorization", `Bearer ${userTokenB}`)
      .send();

    const batchResponse = await request(app.getHttpServer())
      .patch(`/api/admin/meetings/${meeting.id}/applications/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        updates: [
          { applicationId: candidateA.body.id, status: ApplicationStatus.SELECTED },
          { applicationId: candidateB.body.id, status: ApplicationStatus.SELECTED },
        ],
      });

    expect(batchResponse.status).toBe(400);

    const [afterA, afterB] = await Promise.all([
      applicationRepository.findOne({ where: { id: candidateA.body.id } }),
      applicationRepository.findOne({ where: { id: candidateB.body.id } }),
    ]);

    expect(afterA?.status).toBe(ApplicationStatus.PENDING);
    expect(afterB?.status).toBe(ApplicationStatus.PENDING);
  });

  async function registerAndLogin(email: string, name: string, role?: UserRole): Promise<string> {
    const registerResponse = await request(app.getHttpServer()).post("/api/auth/register").send({
      email,
      password: "Password1!",
      name,
    });

    expect(registerResponse.status).toBe(201);

    if (role === UserRole.ADMIN) {
      await userRepository.update({ email }, { role: UserRole.ADMIN });
    }

    const loginResponse = await request(app.getHttpServer()).post("/api/auth/login").send({
      email,
      password: "Password1!",
    });

    expect(loginResponse.status).toBe(200);
    return loginResponse.body.token;
  }

  async function createMeeting(maxParticipants: number, announcementOffsetDays: number): Promise<Meeting> {
    const announcementDate = new Date();
    announcementDate.setDate(announcementDate.getDate() + announcementOffsetDays);
    const dateValue = announcementDate.toISOString().slice(0, 10);

    return meetingRepository.save(
      meetingRepository.create({
        title: `모임-${Date.now()}`,
        category: MeetingCategory.READING,
        description: "모임 설명",
        maxParticipants,
        announcementDate: dateValue,
      })
    );
  }
});
