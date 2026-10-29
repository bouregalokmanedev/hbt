import { env } from "@/config/env";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authStorage } from "@/lib/storage/auth-storage";
import { handleUnauthorizedResponse } from "@/lib/api/unauthorized";

import type {
  Bootcamp,
  BootcampListResponse,
  BootcampRegistration,
  BootcampRegistrationInput,
  BootcampSchedule,
} from "../types/bootcamp.types";

export interface BootcampListParams {
  search?: string;
  level?: string;
  location?: string;
  page?: number;
  per_page?: number;
}

export interface BootcampCalendarParams {
  from?: string;
  to?: string;
}

function buildQuery(params: object = {}): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

async function paginatedApi<T>(endpoint: string): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers();

  headers.set("Accept", "application/json");
  headers.set(
    "Accept-Language",
    localStorage.getItem("hbt-language") === "ar" ? "ar-DZ" : "en-US",
  );

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiUrl}${endpoint}`, {
    method: "GET",
    headers,
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    handleUnauthorizedResponse(response.status, Boolean(token));

    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Unable to load bootcamps.";

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const bootcampsApi = {
  async list(
    params: BootcampListParams = {},
  ): Promise<BootcampListResponse> {
    return paginatedApi<BootcampListResponse>(
      `/v1/catalog/bootcamps${buildQuery(params)}`,
    );
  },

  async get(bootcampId: string): Promise<Bootcamp> {
    return api<Bootcamp>(`/v1/catalog/bootcamps/${bootcampId}`);
  },

  async calendar(
    params: BootcampCalendarParams = {},
  ): Promise<BootcampSchedule[]> {
    return api<BootcampSchedule[]>(
      `/v1/catalog/bootcamps/calendar${buildQuery(params)}`,
    );
  },

  async register(
    bootcampId: string,
    input: BootcampRegistrationInput,
  ): Promise<BootcampRegistration> {
    return api<BootcampRegistration>(
      `/v1/bootcamps/${bootcampId}/registrations`,
      {
        method: "POST",
        body: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          schedule_id: input.scheduleId,
          site: input.site,
          payment_method: input.paymentMethod,
          terms_accepted: input.termsAccepted,
          ...(input.website ? { website: input.website } : {}),
          ...(input.turnstileToken
            ? { turnstile_token: input.turnstileToken }
            : {}),
        },
      },
    );
  },

  brochureUrl(bootcampId: string): string {
    return `${env.apiUrl}/v1/bootcamps/${bootcampId}/brochure`;
  },
};
