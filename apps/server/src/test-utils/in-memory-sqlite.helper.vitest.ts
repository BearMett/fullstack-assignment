import { describe, expect, it } from "vitest";
import { createInMemorySqliteDataSource, destroyDataSource } from "./in-memory-sqlite.helper";

describe("createInMemorySqliteDataSource", () => {
  it("creates an initialized better-sqlite3 in-memory datasource", async () => {
    const dataSource = await createInMemorySqliteDataSource();

    try {
      expect(dataSource.isInitialized).toBe(true);
      expect(dataSource.options.type).toBe("better-sqlite3");
      expect(dataSource.options.database).toBe(":memory:");
    } finally {
      await destroyDataSource(dataSource);
    }
  });
});
