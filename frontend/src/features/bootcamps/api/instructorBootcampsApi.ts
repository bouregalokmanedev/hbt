import { env } from "@/config/env";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { authStorage } from "@/lib/storage/auth-storage";
import { handleUnauthorizedResponse } from "@/lib/api/unauthorized";

import type {
  Bootcamp,
  BootcampListResponse,
  BootcampRegistrationListResponse,
  BootcampRegistrationStatus,
  BootcampSchedule,
  BootcampScheduleInput,
  BootcampSection,
  BootcampCurriculumSectionInput,
  BootcampMediaType,
  InstructorBootcampPayload,
} from "../types/bootcamp.types";

export interface InstructorBootcampParams {
  search?: string;
  status?: string;
  level?: string;
  page?: number;
  per_page?: number;
}

export interface BootcampRegistrationParams {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

async function authorizedFetch<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");
  headers.set(
    "Accept-Language",
    localStorage.getItem("hbt-language") === "ar" ? "ar-DZ" : "en-US",
  );

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiUrl}${endpoint}`, {
    ...init,
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

    const validationMessage =
      typeof payload === "object" &&
      payload !== null &&
      "errors" in payload &&
      typeof payload.errors === "object" &&
      payload.errors !== null
        ? Object.values(payload.errors as Record<string, unknown>)
            .flat()
            .find((value): value is string => typeof value === "string")
        : null;

    const message =
      validationMessage ??
      (typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Unable to save the bootcamp.");

    throw new ApiError(message, response.status);
  }

  return payload as T;
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

export async function getInstructorBootcamps(
  params: InstructorBootcampParams = {},
): Promise<BootcampListResponse> {
  return authorizedFetch<BootcampListResponse>(
    `/v1/instructor/bootcamps${buildQuery(params)}`,
  );
}

export async function getInstructorBootcamp(
  bootcampId: string,
): Promise<Bootcamp> {
  return api<Bootcamp>(`/v1/instructor/bootcamps/${bootcampId}`);
}

export async function createInstructorBootcamp(
  payload: InstructorBootcampPayload,
): Promise<Bootcamp> {
  return api<Bootcamp>("/v1/instructor/bootcamps", {
    method: "POST",
    body: payload,
  });
}

export async function updateInstructorBootcamp(
  bootcampId: string,
  payload: Partial<InstructorBootcampPayload>,
): Promise<Bootcamp> {
  return api<Bootcamp>(`/v1/instructor/bootcamps/${bootcampId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteInstructorBootcamp(
  bootcampId: string,
): Promise<void> {
  await api(`/v1/instructor/bootcamps/${bootcampId}`, {
    method: "DELETE",
  });
}

export async function runInstructorBootcampAction(
  bootcampId: string,
  action: "publish" | "unpublish",
): Promise<Bootcamp> {
  return api<Bootcamp>(
    `/v1/instructor/bootcamps/${bootcampId}/${action}`,
    { method: "POST" },
  );
}

export async function uploadInstructorBootcampBrochure(
  bootcampId: string,
  file: File,
): Promise<Bootcamp> {
  const form = new FormData();
  form.append("brochure", file);

  const result = await authorizedFetch<{ data: Bootcamp }>(
    `/v1/instructor/bootcamps/${bootcampId}/brochure`,
    { method: "POST", body: form },
  );

  return result.data;
}

export async function uploadInstructorBootcampMedia(
  bootcampId: string,
  type: BootcampMediaType,
  file: File,
): Promise<Bootcamp> {
  const form = new FormData();
  form.append("file", file);

  const result = await authorizedFetch<{ data: Bootcamp }>(
    `/v1/instructor/bootcamps/${bootcampId}/media/${type}`,
    { method: "POST", body: form },
  );

  return result.data;
}

export async function removeInstructorBootcampMedia(
  bootcampId: string,
  type: BootcampMediaType,
): Promise<Bootcamp> {
  const result = await authorizedFetch<{ data: Bootcamp }>(
    `/v1/instructor/bootcamps/${bootcampId}/media/${type}`,
    { method: "DELETE" },
  );

  return result.data;
}

export async function syncInstructorBootcampCurriculum(
  bootcampId: string,
  sections: BootcampCurriculumSectionInput[],
): Promise<BootcampSection[]> {
  const result = await authorizedFetch<{
    data: { sections: BootcampSection[] };
  }>(`/v1/instructor/bootcamps/${bootcampId}/curriculum`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sections }),
  });

  return result.data.sections;
}

export async function createInstructorBootcampSchedule(
  bootcampId: string,
  payload: BootcampScheduleInput,
): Promise<BootcampSchedule> {
  return api<BootcampSchedule>(
    `/v1/instructor/bootcamps/${bootcampId}/schedules`,
    { method: "POST", body: payload },
  );
}

export async function updateInstructorBootcampSchedule(
  bootcampId: string,
  scheduleId: string,
  payload: BootcampScheduleInput,
): Promise<BootcampSchedule> {
  return api<BootcampSchedule>(
    `/v1/instructor/bootcamps/${bootcampId}/schedules/${scheduleId}`,
    { method: "PATCH", body: payload },
  );
}

export async function deleteInstructorBootcampSchedule(
  bootcampId: string,
  scheduleId: string,
): Promise<void> {
  await api(
    `/v1/instructor/bootcamps/${bootcampId}/schedules/${scheduleId}`,
    { method: "DELETE" },
  );
}

export async function getBootcampRegistrations(
  bootcampId: string,
  params: BootcampRegistrationParams = {},
): Promise<BootcampRegistrationListResponse> {
  return authorizedFetch<BootcampRegistrationListResponse>(
    `/v1/instructor/bootcamps/${bootcampId}/registrations${buildQuery(params)}`,
  );
}

export async function updateBootcampRegistrationStatus(
  bootcampId: string,
  registrationId: string,
  status: BootcampRegistrationStatus,
): Promise<void> {
  await api(
    `/v1/instructor/bootcamps/${bootcampId}/registrations/${registrationId}`,
    { method: "PATCH", body: { status } },
  );
}
