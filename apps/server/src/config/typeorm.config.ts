import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { MeetingCategory } from "@packages/shared";
import { DataSourceOptions } from "typeorm";
import * as allEntities from "../entity";
import { DATABASE_NAME, DATABASE_PATH } from "../constants/database.constant";

const legacyMeetingCategoryCases = `CASE category
  WHEN '독서' THEN '${MeetingCategory.READING}'
  WHEN '운동' THEN '${MeetingCategory.EXERCISE}'
  WHEN '기록' THEN '${MeetingCategory.WRITING}'
  WHEN '영어' THEN '${MeetingCategory.ENGLISH}'
  ELSE category
END`;

export const createTypeOrmOptions = (): TypeOrmModuleOptions & DataSourceOptions => {
  return {
    name: DATABASE_NAME,
    type: "better-sqlite3",
    database: process.env["DATABASE_PATH"] || DATABASE_PATH,
    entities: Object.values(allEntities),
    synchronize: true,
    logging: true,
    // better-sqlite3 전용 옵션
    enableWAL: true, // Write-Ahead Logging 활성화 (성능 향상)
    prepareDatabase: (db) => {
      // 외래 키 제약 조건 활성화
      db.prepare("PRAGMA foreign_keys = ON;").run();
      // 성능 최적화 설정
      db.prepare("PRAGMA journal_mode = WAL;").run();
      db.prepare("PRAGMA synchronous = NORMAL;").run();

      const meetingTable = db
        .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'meeting'")
        .get() as { sql?: string } | undefined;

      if (meetingTable?.sql?.includes("'독서'")) {
        db.exec("PRAGMA foreign_keys = OFF;");
        db.exec("BEGIN TRANSACTION;");
        db.exec(`
          ALTER TABLE meeting RENAME TO meeting_legacy;
          CREATE TABLE meeting (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            title varchar NOT NULL,
            category varchar CHECK(category IN ('READING','EXERCISE','WRITING','ENGLISH')) NOT NULL,
            description text NOT NULL,
            maxParticipants integer NOT NULL,
            announcementDate date NOT NULL,
            createdAt datetime NOT NULL DEFAULT (datetime('now')),
            updatedAt datetime NOT NULL DEFAULT (datetime('now')),
            CONSTRAINT CHK_cd30e55ae16845e744ce42e393 CHECK ("maxParticipants" >= 1)
          );
          INSERT INTO meeting (id, title, category, description, maxParticipants, announcementDate, createdAt, updatedAt)
          SELECT id, title, ${legacyMeetingCategoryCases}, description, maxParticipants, announcementDate, createdAt, updatedAt
          FROM meeting_legacy;
          DROP TABLE meeting_legacy;
          COMMIT;
        `);
        db.exec("PRAGMA foreign_keys = ON;");
      }
    },
  };
};
