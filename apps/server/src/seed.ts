import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DataSource } from "typeorm";
import { MeetingCategory, UserRole } from "@packages/shared";
import { Meeting, User } from "./entity";
import { createTypeOrmOptions } from "./config";
import { hashPassword } from "./modules/auth/password.util";

const PASSWORD = "Password1!";
const ALLOWED_ENVIRONMENTS = new Set(["development", "test"]);

type UserSeed = {
  email: string;
  name: string;
  role: UserRole;
};

type MeetingSeed = {
  title: string;
  category: MeetingCategory;
  description: string;
  maxParticipants: number;
  announcementDate: string;
};

const userSeeds: UserSeed[] = [
  { email: "admin@sangsang.com", name: "상상단 관리자", role: UserRole.ADMIN },
  { email: "user@example.com", name: "기본 회원", role: UserRole.USER },
  { email: "second-user@example.com", name: "예비 참가자", role: UserRole.USER },
];

const meetingSeeds: MeetingSeed[] = [
  {
    title: "3월 독서 모임",
      category: MeetingCategory.READING,
    description: "3월 중순에 함께 읽고 이야기할 책을 골라보는 시간입니다.",
    maxParticipants: 10,
    announcementDate: "2026-03-25",
  },
  {
    title: "2월 운동 모임",
      category: MeetingCategory.EXERCISE,
    description: "2월에 건강한 습관과 운동 기록을 나누는 모임입니다.",
    maxParticipants: 12,
    announcementDate: "2026-02-10",
  },
];

async function seedUsers(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(User);

  for (const seed of userSeeds) {
    const password = hashPassword(PASSWORD);
    const existing = await repository.findOne({ where: { email: seed.email } });

    if (existing) {
      existing.name = seed.name;
      existing.role = seed.role;
      existing.password = password;
      await repository.save(existing);
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

function ensureDatabaseDirectory(databasePath: string | undefined): void {
  if (!databasePath) {
    return;
  }

  mkdirSync(dirname(databasePath), { recursive: true });
}

async function main(): Promise<void> {
  const env = process.env.NODE_ENV ?? "development";

  if (!ALLOWED_ENVIRONMENTS.has(env)) {
    throw new Error(`Seeding is restricted to development/test environments (current: ${env})`);
  }

  const options = createTypeOrmOptions();
  ensureDatabaseDirectory(typeof options.database === "string" ? options.database : undefined);

  const dataSource = new DataSource(options);
  await dataSource.initialize();

  try {
    await seedUsers(dataSource);
    await seedMeetings(dataSource);
  } finally {
    await dataSource.destroy();
  }

  console.log("All seed data is up to date.");
}

main().catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});
