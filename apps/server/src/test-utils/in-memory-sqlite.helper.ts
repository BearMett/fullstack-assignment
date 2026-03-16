import { DataSource } from "typeorm";
import type { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions";
import * as allEntities from "../entity";

export async function createInMemorySqliteDataSource(
  options: Partial<BetterSqlite3ConnectionOptions> = {}
): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "better-sqlite3",
    database: ":memory:",
    entities: Object.values(allEntities),
    synchronize: true,
    logging: false,
    ...options,
  });

  await dataSource.initialize();

  return dataSource;
}

export async function destroyDataSource(dataSource: DataSource): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
