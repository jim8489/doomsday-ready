
import type { ApiErrorPayload } from "../types/api";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export class ApiError extends Error {
    readonly status: number;
    readonly payload: unknown;
  
    constructor(
      status: number,
      payload: unknown,
      message: string,
    ) {
      super(message);
  
      this.name = "ApiError";
      this.status = status;
      this.payload = payload;
  
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload !== null) {
    const error = payload as ApiErrorPayload;

    if (typeof error.detail === "string") {
      return error.detail;
    }

    if (typeof error.code === "string") {
      return error.code;
    }

    return Object.entries(error)
      .map(([field, value]) => {
        const description = Array.isArray(value)
          ? value.join(", ")
          : String(value);

        return `${field}: ${description}`;
      })
      .join("; ");
  }

  return `Request failed with status ${status}.`;
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...options,
      headers,
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    },
  );

  const responseText = await response.text();

  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload,
      getErrorMessage(payload, response.status),
    );
  }

  return payload as T;
}
