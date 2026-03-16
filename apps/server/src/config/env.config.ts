import { existsSync } from "fs";
import { join } from "path";

const NODE_ENV = process.env["NODE_ENV"];
export const getEnvFilePath = () => {
  const worktreeEnvFromCwd = join(process.cwd(), ".env.worktree");
  const worktreeEnvFromServerDir = join(process.cwd(), "..", "..", ".env.worktree");

  if (existsSync(worktreeEnvFromCwd)) {
    return ".env.worktree";
  }

  if (existsSync(worktreeEnvFromServerDir)) {
    return "../../.env.worktree";
  }

  return ".env" + (NODE_ENV === "local" ? ".local" : NODE_ENV === "development" ? ".development" : "");
};

export const validateEnv = (env: Record<string, string | undefined>) => {
  if (!env["JWT_SECRET"]) {
    const worktreeTaskId = env["WORKTREE_TASK_ID"];

    if (worktreeTaskId) {
      env["JWT_SECRET"] = `worktree-${worktreeTaskId}-secret`;
    } else {
      throw new Error("JWT_SECRET is required");
    }
  }

  return env;
};
