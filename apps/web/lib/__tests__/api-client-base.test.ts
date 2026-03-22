import { describe, it, expect, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  extractApiErrorMessage,
} from "../api-client/base";

describe("Auth Token 관리", () => {
  beforeEach(() => {
    clearAuthToken();
  });

  it("초기 토큰은 null이다", () => {
    expect(getAuthToken()).toBeNull();
  });

  it("setAuthToken으로 토큰을 설정할 수 있다", () => {
    setAuthToken("my-token");
    expect(getAuthToken()).toBe("my-token");
  });

  it("clearAuthToken으로 토큰을 제거할 수 있다", () => {
    setAuthToken("my-token");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it("토큰을 연속으로 변경하면 마지막 값이 유지된다", () => {
    setAuthToken("token-1");
    setAuthToken("token-2");
    setAuthToken("token-3");
    expect(getAuthToken()).toBe("token-3");
  });
});

describe("extractApiErrorMessage", () => {
  it("Axios 에러에서 문자열 message를 추출한다", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { message: "이메일이 중복됩니다" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    expect(extractApiErrorMessage(error)).toBe("이메일이 중복됩니다");
  });

  it("Axios 에러에서 배열 message의 첫 번째 항목을 추출한다", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { message: ["이름은 필수입니다", "이메일 형식이 올바르지 않습니다"] },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    expect(extractApiErrorMessage(error)).toBe("이름은 필수입니다");
  });

  it("Axios 에러에 message가 없으면 Error.message를 사용한다", () => {
    const error = new AxiosError("Network Error");
    expect(extractApiErrorMessage(error)).toBe("Network Error");
  });

  it("일반 Error의 message를 사용한다", () => {
    const error = new Error("Something went wrong");
    expect(extractApiErrorMessage(error)).toBe("Something went wrong");
  });

  it("알 수 없는 에러는 기본 메시지를 반환한다", () => {
    expect(extractApiErrorMessage(null)).toBe("요청을 처리하지 못했습니다");
    expect(extractApiErrorMessage(undefined)).toBe("요청을 처리하지 못했습니다");
    expect(extractApiErrorMessage(42)).toBe("요청을 처리하지 못했습니다");
  });

  it("커스텀 fallback 메시지를 사용할 수 있다", () => {
    expect(extractApiErrorMessage(null, "다시 시도해주세요")).toBe("다시 시도해주세요");
  });
});
