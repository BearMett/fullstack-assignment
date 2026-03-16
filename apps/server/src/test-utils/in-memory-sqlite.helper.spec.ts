import { DataSource } from "typeorm";
import { UserRole } from "@packages/shared";
import { User } from "../entity";
import { createInMemorySqliteDataSource, destroyDataSource } from "./in-memory-sqlite.helper";

describe("createInMemorySqliteDataSource", () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (dataSource) {
      await destroyDataSource(dataSource);
    }
  });

  it("creates an isolated sqlite database with configured entities", async () => {
    dataSource = await createInMemorySqliteDataSource();
    const userRepository = dataSource.getRepository(User);

    await userRepository.save({
      email: "test@example.com",
      password: "hashed-password",
      name: "테스트 유저",
      role: UserRole.USER,
    });
    const savedRows = await userRepository.find();

    expect(savedRows).toHaveLength(1);
    expect(savedRows[0]?.email).toBe("test@example.com");
  });
});
