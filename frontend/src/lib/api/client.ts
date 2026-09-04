import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";
import { ApiError } from "./errors";
import type { ApiResponse } from "./types";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = authStorage.getToken();

  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  headers.set(
    "Accept-Language",
    localStorage.getItem("hbt-language") === "ar" ? "ar-DZ" : "en-US",
  );

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiUrl}${endpoint}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = payload as ApiResponse<T> | null;

    throw new ApiError(
      errorPayload?.message ?? "Something went wrong.",
      response.status,
      errorPayload && "errors" in errorPayload
        ? errorPayload.errors
        : undefined,
    );
  }

  /*
   * Support both:
   *
   * {
   *   "data": {...}
   * }
   *
   * and:
   *
   * {
   *   "id": "...",
   *   "title": "..."
   * }
   */

  if (payload && typeof payload === "object" && "data" in payload) {
    return (
      payload as {
        data: T;
      }
    ).data;
  }

  return payload as T;
}
