import { describe, expect, it } from "vitest";
import { extractApiErrorMessage } from "../lib/api-client";

const INVALID_CREDENTIALS_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다";

describe("extractApiErrorMessage", () => {
  it("returns backend string message as-is", () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: INVALID_CREDENTIALS_MESSAGE,
        },
      },
    };

    expect(extractApiErrorMessage(error)).toBe(INVALID_CREDENTIALS_MESSAGE);
  });

  it("falls back when payload has no message", () => {
    expect(extractApiErrorMessage({}, "대체 메시지")).toBe("대체 메시지");
  });
});
