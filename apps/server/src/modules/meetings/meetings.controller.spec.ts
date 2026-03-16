import { ApplicationStatus, MeetingCategory, UserRole } from "@packages/shared";
import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as request from "supertest";
import * as allEntities from "../../entity";
import { Application, Meeting, User } from "../../entity";
import { middleware } from "../app.middleware";
import { AuthModule } from "../auth/auth.module";
import { MeetingsModule } from "./meetings.module";

const dateOffset = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

describe("MeetingsController (core)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let meetingRepository: Repository<Meeting>;
  let applicationRepository: Repository<Application>;

  beforeEach(async () => {
    process.env["JWT_SECRET"] = "test-jwt-secret";

    const moduleRef = await Test.createTestingModule({
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
        MeetingsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    await middleware(app as NestExpressApplication);
    await app.init();

    userRepository = app.get(getRepositoryToken(User));
    meetingRepository = app.get(getRepositoryToken(Meeting));
    applicationRepository = app.get(getRepositoryToken(Application));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  const createUserSession = async (role: UserRole): Promise<{ token: string; userId: number }> => {
    const email = `${role}-${Date.now()}-${Math.random()}@example.com`;
    const registerResponse = await request(app.getHttpServer()).post("/api/auth/register").send({
      email,
      password: "Password1!",
      name: "테스터",
    });

    if (role === UserRole.ADMIN) {
      await userRepository.update({ email }, { role: UserRole.ADMIN });

      const loginResponse = await request(app.getHttpServer()).post("/api/auth/login").send({
        email,
        password: "Password1!",
      });

      const adminUser = await userRepository.findOneByOrFail({ email });

      return { token: loginResponse.body.token, userId: adminUser.id };
    }

    const user = await userRepository.findOneByOrFail({ email });

    return { token: registerResponse.body.token, userId: user.id };
  };

  it("requires admin role to create meeting", async () => {
    const { token: userToken } = await createUserSession(UserRole.USER);
    const payload = {
      title: "관리자 전용 모임",
      category: MeetingCategory.READING,
      description: "관리자만 생성",
      maxParticipants: 5,
      announcementDate: dateOffset(3),
    };

    const unauthorizedResponse = await request(app.getHttpServer()).post("/api/meetings").send(payload);

    expect(unauthorizedResponse.status).toBe(401);

    const forbiddenResponse = await request(app.getHttpServer())
      .post("/api/meetings")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload);

    expect(forbiddenResponse.status).toBe(403);
  });

  it("creates meeting for admin with valid payload", async () => {
    const { token: adminToken } = await createUserSession(UserRole.ADMIN);
    const announcementDate = dateOffset(3);

    const response = await request(app.getHttpServer())
      .post("/api/meetings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "신규 모임",
        category: MeetingCategory.READING,
        description: "정상 생성",
        maxParticipants: 6,
        announcementDate,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        title: "신규 모임",
        category: MeetingCategory.READING,
        description: "정상 생성",
        maxParticipants: 6,
        announcementDate,
      })
    );
  });

  it("validates category, announcementDate, and maxParticipants on create", async () => {
    const { token: adminToken } = await createUserSession(UserRole.ADMIN);

    const invalidCategoryResponse = await request(app.getHttpServer())
      .post("/api/meetings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "잘못된 카테고리",
        category: "취미",
        description: "검증 실패",
        maxParticipants: 5,
        announcementDate: dateOffset(3),
      });

    expect(invalidCategoryResponse.status).toBe(400);

    const invalidAnnouncementDateResponse = await request(app.getHttpServer())
      .post("/api/meetings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "지난 발표일",
        category: MeetingCategory.EXERCISE,
        description: "검증 실패",
        maxParticipants: 3,
        announcementDate: dateOffset(-1),
      });

    expect(invalidAnnouncementDateResponse.status).toBe(400);

    const invalidMaxParticipantsResponse = await request(app.getHttpServer())
      .post("/api/meetings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "최소 인원 실패",
        category: MeetingCategory.ENGLISH,
        description: "검증 실패",
        maxParticipants: 0,
        announcementDate: dateOffset(3),
      });

    expect(invalidMaxParticipantsResponse.status).toBe(400);
  });

  it("returns recruiting-only meetings to users and all meetings to admins", async () => {
    const { token: userToken, userId } = await createUserSession(UserRole.USER);
    const { token: adminToken, userId: adminUserId } = await createUserSession(UserRole.ADMIN);

    const recruitingMeeting = await meetingRepository.save({
      title: "모집중 모임",
      category: MeetingCategory.READING,
      description: "모집중",
      maxParticipants: 2,
      announcementDate: dateOffset(2),
    });

    const closedMeeting = await meetingRepository.save({
      title: "마감 모임",
      category: MeetingCategory.WRITING,
      description: "마감",
      maxParticipants: 2,
      announcementDate: dateOffset(-2),
    });

    await applicationRepository.save({
      userId,
      meetingId: recruitingMeeting.id,
    });

    await applicationRepository.save({
      userId: adminUserId,
      meetingId: closedMeeting.id,
    });

    const userListResponse = await request(app.getHttpServer())
      .get("/api/meetings")
      .set("Authorization", `Bearer ${userToken}`);

    expect(userListResponse.status).toBe(200);
    expect(userListResponse.body).toHaveLength(1);
    expect(userListResponse.body[0]).toEqual(
      expect.objectContaining({
        id: recruitingMeeting.id,
        isRecruiting: true,
        applicantCount: 1,
      })
    );

    const adminListResponse = await request(app.getHttpServer())
      .get("/api/meetings")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminListResponse.status).toBe(200);
    expect(adminListResponse.body).toHaveLength(2);
    expect(adminListResponse.body.find((meeting: { id: number }) => meeting.id === closedMeeting.id)).toEqual(
      expect.objectContaining({
        id: closedMeeting.id,
        isRecruiting: false,
        applicantCount: 1,
      })
    );
  });

  it("requires authentication for list and detail endpoints", async () => {
    const meeting = await meetingRepository.save({
      title: "인증 테스트",
      category: MeetingCategory.EXERCISE,
      description: "인증 필요",
      maxParticipants: 5,
      announcementDate: dateOffset(2),
    });

    const listResponse = await request(app.getHttpServer()).get("/api/meetings");
    const detailResponse = await request(app.getHttpServer()).get(`/api/meetings/${meeting.id}`);

    expect(listResponse.status).toBe(401);
    expect(detailResponse.status).toBe(401);
  });

  it("returns masked myApplication status before announcement date for users", async () => {
    const { token: userToken, userId } = await createUserSession(UserRole.USER);

    const meeting = await meetingRepository.save({
      title: "발표 전 상세",
      category: MeetingCategory.ENGLISH,
      description: "결과 마스킹",
      maxParticipants: 7,
      announcementDate: dateOffset(3),
    });

    const application = await applicationRepository.save({
      userId,
      meetingId: meeting.id,
      status: ApplicationStatus.SELECTED,
    });

    const response = await request(app.getHttpServer())
      .get(`/api/meetings/${meeting.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.canApply).toBe(false);
    expect(response.body.myApplication).toEqual(
      expect.objectContaining({
        id: application.id,
        userId,
        meetingId: meeting.id,
        status: ApplicationStatus.PENDING,
        displayStatus: ApplicationStatus.PENDING,
        resultMessage: "발표일에 결과가 공개됩니다",
      })
    );
    expect(response.body).not.toHaveProperty("selectedCount");
    expect(response.body).not.toHaveProperty("rejectedCount");
    expect(response.body).not.toHaveProperty("pendingCount");
  });

  it("returns visible myApplication status and result message on/after announcement date for users", async () => {
    const { token: userToken, userId } = await createUserSession(UserRole.USER);

    const meeting = await meetingRepository.save({
      title: "발표 후 상세",
      category: MeetingCategory.READING,
      description: "결과 공개",
      maxParticipants: 5,
      announcementDate: dateOffset(0),
    });

    const application = await applicationRepository.save({
      userId,
      meetingId: meeting.id,
      status: ApplicationStatus.REJECTED,
    });

    const response = await request(app.getHttpServer())
      .get(`/api/meetings/${meeting.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.canApply).toBe(false);
    expect(response.body.myApplication).toEqual(
      expect.objectContaining({
        id: application.id,
        userId,
        meetingId: meeting.id,
        status: ApplicationStatus.REJECTED,
        displayStatus: ApplicationStatus.REJECTED,
        resultMessage: "아쉽게도 이번 모임에 함께하지 못했어요",
      })
    );
  });

  it("returns myApplication as null when user has not applied", async () => {
    const { token: userToken } = await createUserSession(UserRole.USER);

    const meeting = await meetingRepository.save({
      title: "미신청 상세",
      category: MeetingCategory.EXERCISE,
      description: "미신청 상태",
      maxParticipants: 8,
      announcementDate: dateOffset(2),
    });

    const response = await request(app.getHttpServer())
      .get(`/api/meetings/${meeting.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.canApply).toBe(true);
    expect(response.body.myApplication).toBeNull();
  });

  it("returns aggregate counts and actual statuses for admin detail", async () => {
    const { token: adminToken } = await createUserSession(UserRole.ADMIN);
    const { userId: selectedUserId } = await createUserSession(UserRole.USER);
    const { userId: rejectedUserId } = await createUserSession(UserRole.USER);
    const { userId: pendingUserId } = await createUserSession(UserRole.USER);

    const meeting = await meetingRepository.save({
      title: "관리자 상세",
      category: MeetingCategory.WRITING,
      description: "관리자 집계",
      maxParticipants: 2,
      announcementDate: dateOffset(3),
    });

    await applicationRepository.save([
      { userId: selectedUserId, meetingId: meeting.id, status: ApplicationStatus.SELECTED },
      { userId: rejectedUserId, meetingId: meeting.id, status: ApplicationStatus.REJECTED },
      { userId: pendingUserId, meetingId: meeting.id, status: ApplicationStatus.PENDING },
    ]);

    const response = await request(app.getHttpServer())
      .get(`/api/meetings/${meeting.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        selectedCount: 1,
        rejectedCount: 1,
        pendingCount: 1,
      })
    );
    expect(response.body).not.toHaveProperty("canApply");
    expect(response.body).not.toHaveProperty("myApplication");
  });

  it("returns 404 when meeting detail does not exist", async () => {
    const { token: userToken } = await createUserSession(UserRole.USER);

    const response = await request(app.getHttpServer())
      .get("/api/meetings/999999")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});
