import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DataSource } from "typeorm";
import { ApplicationStatus, MeetingCategory, UserRole } from "@packages/shared";
import { Application, Meeting, User } from "./entity";
import { createTypeOrmOptions } from "./config";
import { hashPassword } from "./modules/auth/password.util";

const PASSWORD = "Password1!";
const ALLOWED_ENVIRONMENTS = new Set(["development", "test"]);

type UserSeed = {
  email?: string;
  name: string;
  phone: string;
  role: UserRole;
};

type MeetingSeed = {
  title: string;
  category: MeetingCategory;
  description: string;
  maxParticipants: number;
  deadlineDate: string;
  announcementDate: string;
  allowReapply: boolean;
};

type ApplicationSeed = {
  userName: string;
  meetingTitle: string;
  motivation?: string;
  status?: ApplicationStatus;
};

const userSeeds: UserSeed[] = [
  { email: "admin@sangsang.com", name: "모임터 관리자", phone: "010-0000-0000", role: UserRole.ADMIN },
  { name: "김지수", phone: "010-1234-5678", role: UserRole.USER },
  { name: "이민호", phone: "010-2345-6789", role: UserRole.USER },
  { name: "박서연", phone: "010-3456-7890", role: UserRole.USER },
  { name: "최준혁", phone: "010-4567-8901", role: UserRole.USER },
  { name: "정하나", phone: "010-5678-9012", role: UserRole.USER },
];

const meetingSeeds: MeetingSeed[] = [
  {
    title: "3월 독서 모임: 아몬드",
    category: MeetingCategory.READING,
    description: '손원평 작가의 "아몬드"를 읽고 감정과 공감에 대해 이야기 나눠보았습니다.',
    maxParticipants: 8,
    deadlineDate: "2026-03-15",
    announcementDate: "2026-03-17",
    allowReapply: false,
  },
  {
    title: "영어 스피킹 클럽 — Free Talk",
    category: MeetingCategory.ENGLISH,
    description:
      "매주 수요일 저녁, 편안한 분위기에서 영어로 대화해요. 주제는 매주 달라지고, 레벨 상관없이 누구나 참여 가능합니다. 실수해도 괜찮아요!",
    maxParticipants: 10,
    deadlineDate: "2026-03-18",
    announcementDate: "2026-03-20",
    allowReapply: false,
  },
  {
    title: "주말 러닝 크루 4기",
    category: MeetingCategory.EXERCISE,
    description:
      "매주 토요일 아침 7시, 수원 광교호수공원에서 함께 달려요! 초보자도 환영합니다. 5km~10km 코스로 페이스에 맞춰 함께 뛰어요.",
    maxParticipants: 15,
    deadlineDate: "2026-03-20",
    announcementDate: "2026-03-24",
    allowReapply: false,
  },
  {
    title: "요가 & 명상 소모임",
    category: MeetingCategory.EXERCISE,
    description:
      "주 2회 저녁, 간단한 요가와 명상으로 하루를 마무리하는 소모임입니다. 매번 잊으면 OK!",
    maxParticipants: 12,
    deadlineDate: "2026-03-28",
    announcementDate: "2026-03-31",
    allowReapply: true,
  },
  {
    title: "4월 독서 모임: 달러구트 꿈 백화점",
    category: MeetingCategory.READING,
    description:
      '이미래 작가의 베스트 셀러 "달러구트 꿈 백화점"을 함께 읽고 이야기를 나눕니다. 따뜻하고 환상적인 이야기 속에서 삶의 의미를 돌아보는 시간이 될 거예요.',
    maxParticipants: 8,
    deadlineDate: "2026-04-05",
    announcementDate: "2026-04-08",
    allowReapply: true,
  },
  {
    title: "매일 기록 챌린지 — 30일 일기",
    category: MeetingCategory.WRITING,
    description:
      "하루 10분, 매일 기록하는 습관을 만들어보아요. 짧은 일기, 감사 노트, 오늘의 한줄 등 형식은 자유! 서로의 기록을 응원하는 따뜻한 챌린지입니다.",
    maxParticipants: 20,
    deadlineDate: "2026-04-12",
    announcementDate: "2026-04-15",
    allowReapply: true,
  },
];

const applicationSeeds: ApplicationSeed[] = [
  // 3월 독서 모임: 아몬드 (마감+발표완료)
  { userName: "김지수", meetingTitle: "3월 독서 모임: 아몬드", motivation: "감성적인 책을 좋아해서 신청했어요.", status: ApplicationStatus.SELECTED },
  { userName: "박서연", meetingTitle: "3월 독서 모임: 아몬드", motivation: "친구 추천으로 알게 됐어요." },
  // 영어 스피킹 클럽 (마감+발표완료)
  { userName: "김지수", meetingTitle: "영어 스피킹 클럽 — Free Talk", motivation: "영어 스피킹 연습이 필요한데 혼자 하기 어려워서 신청합니다.", status: ApplicationStatus.SELECTED },
  { userName: "정하나", meetingTitle: "영어 스피킹 클럽 — Free Talk", motivation: "해외 취업 준비 중이라 스피킹 실력을 키우고 싶습니다.", status: ApplicationStatus.REJECTED },
  // 주말 러닝 크루 4기 (마감, 발표 전)
  { userName: "김지수", meetingTitle: "주말 러닝 크루 4기", motivation: "건강한 습관을 만들고 싶어서 신청합니다!" },
  { userName: "최준혁", meetingTitle: "주말 러닝 크루 4기", motivation: "아침 러닝으로 하루를 시작하고 싶어요." },
  { userName: "이민호", meetingTitle: "주말 러닝 크루 4기", motivation: "운동 동기부여가 필요해요!" },
  // 요가 & 명상 소모임 (모집 중)
  { userName: "박서연", meetingTitle: "요가 & 명상 소모임", motivation: "명상에 관심이 생겨서 참여하고 싶어요." },
  // 4월 독서 모임: 달러구트 꿈 백화점 (모집 중)
  { userName: "김지수", meetingTitle: "4월 독서 모임: 달러구트 꿈 백화점", motivation: "이 책 정말 읽고 싶었어요! 함께 이야기 나누고 싶습니다." },
  { userName: "정하나", meetingTitle: "4월 독서 모임: 달러구트 꿈 백화점", motivation: "환상문학을 좋아해서 꼭 참여하고 싶습니다." },
  // 매일 기록 챌린지 (모집 중)
  { userName: "이민호", meetingTitle: "매일 기록 챌린지 — 30일 일기", motivation: "글쓰기 습관을 기르고 싶어요." },
];

async function seedUsers(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(User);

  for (const seed of userSeeds) {
    const password = seed.email ? hashPassword(PASSWORD) : undefined;

    if (seed.email) {
      const existing = await repository.findOne({ where: { email: seed.email } });
      if (existing) {
        existing.name = seed.name;
        existing.role = seed.role;
        existing.phone = seed.phone;
        if (password) existing.password = password;
        await repository.save(existing);
        continue;
      }
    }

    // Check by name+phone for simple-login users
    const existingByName = await repository.findOne({ where: { name: seed.name, phone: seed.phone } });
    if (existingByName) {
      existingByName.role = seed.role;
      if (seed.email) existingByName.email = seed.email;
      if (password) existingByName.password = password;
      await repository.save(existingByName);
      continue;
    }

    await repository.save(repository.create({ ...seed, password }));
  }

  console.log(`✅ Seeded ${userSeeds.length} demo users`);
}

async function seedMeetings(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Meeting);

  for (const seed of meetingSeeds) {
    const existing = await repository.findOne({ where: { title: seed.title } });

    if (existing) {
      await repository.save({ ...existing, ...seed });
      continue;
    }

    await repository.save(repository.create(seed));
  }

  console.log(`✅ Seeded ${meetingSeeds.length} demo meetings`);
}

async function seedApplications(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const meetingRepository = dataSource.getRepository(Meeting);
  const applicationRepository = dataSource.getRepository(Application);

  let count = 0;

  for (const seed of applicationSeeds) {
    const user = await userRepository.findOne({ where: { name: seed.userName } });
    const meeting = await meetingRepository.findOne({ where: { title: seed.meetingTitle } });

    if (!user || !meeting) continue;

    const existing = await applicationRepository.findOne({
      where: { userId: user.id, meetingId: meeting.id },
    });

    if (existing) {
      existing.motivation = seed.motivation ?? null;
      if (seed.status) existing.status = seed.status;
      await applicationRepository.save(existing);
      count++;
      continue;
    }

    await applicationRepository.save(
      applicationRepository.create({
        userId: user.id,
        meetingId: meeting.id,
        motivation: seed.motivation ?? null,
        status: seed.status ?? ApplicationStatus.PENDING,
      })
    );
    count++;
  }

  console.log(`✅ Seeded ${count} demo applications`);
}

function ensureDatabaseDirectory(databasePath: string | undefined): void {
  if (!databasePath) {
    return;
  }

  mkdirSync(dirname(databasePath), { recursive: true });
}

export function shouldSeedDemoData(nodeEnv: string | undefined): boolean {
  const env = nodeEnv ?? "development";
  return ALLOWED_ENVIRONMENTS.has(env);
}

export async function seedDemoData(dataSource: DataSource): Promise<void> {
  await seedUsers(dataSource);
  await seedMeetings(dataSource);
  await seedApplications(dataSource);
}

async function main(): Promise<void> {
  const env = process.env.NODE_ENV;

  if (!shouldSeedDemoData(env)) {
    throw new Error(`Seeding is restricted to development/test environments (current: ${env})`);
  }

  const options = createTypeOrmOptions();
  ensureDatabaseDirectory(typeof options.database === "string" ? options.database : undefined);

  const dataSource = new DataSource(options);
  await dataSource.initialize();

  try {
    await seedDemoData(dataSource);
  } finally {
    await dataSource.destroy();
  }

  console.log("All seed data is up to date.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
}
