import axios, { type AxiosInstance } from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

type ApiErrorPayload = {
  message?: string | string[];
};

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authToken = null;
        unauthorizedHandler?.();
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiInstance = createAxiosInstance();

export const setAuthToken = (token: string): void => {
  authToken = token;
};

export const clearAuthToken = (): void => {
  authToken = null;
};

export const getAuthToken = (): string | null => {
  return authToken;
};

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "요청을 처리하지 못했습니다"
): string => {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export class BaseApiClient {
  protected api: AxiosInstance;

  constructor() {
    this.api = apiInstance;
  }
}
