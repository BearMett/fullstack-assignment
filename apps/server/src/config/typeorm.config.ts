import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";
import * as allEntities from "../entity";
import { DATABASE_NAME, DATABASE_PATH } from "../constants/database.constant";
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
    },
  };
};
