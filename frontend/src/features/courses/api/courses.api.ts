import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";

import type { Course, CourseCurriculum } from "../types/course.types";

export interface CourseListParams {
  search?: string;
  difficulty?: string;
  free?: boolean;
  language?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface CoursePaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  path: string;

  links: PaginationLink[];
}

export interface CoursePaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface CourseListResponse {
  data: Course[];

  links: CoursePaginationLinks;

  meta: CoursePaginationMeta;
}

export async function getCourse(courseId: string): Promise<Course> {
  return api<Course>(`/v1/catalog/courses/${courseId}`);
}

export async function getCourseCurriculum(
  courseId: string,
): Promise<CourseCurriculum> {
  return api<CourseCurriculum>(`/v1/courses/${courseId}/curriculum`);
}

export interface CourseReviewsResponse {
  summary: { count: number; average_rating: number };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    reviewer: string;
    created_at: string | null;
  }>;
}

export async function getCourseReviews(
  courseId: string,
): Promise<CourseReviewsResponse> {
  return api<CourseReviewsResponse>(`/v1/courses/${courseId}/reviews`);
}

function buildQuery(params: CourseListParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.difficulty) {
    searchParams.set("difficulty", params.difficulty);
  }

  if (params.free !== undefined) {
    searchParams.set("free", params.free ? "1" : "0");
  }

  if (params.language) {
    searchParams.set("language", params.language);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.per_page) {
    searchParams.set("per_page", String(params.per_page));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

/**
 * Fetch a Laravel paginated response.
 *
 * This is intentionally separate from the normal api()
 * helper because Laravel pagination returns:
 *
 * {
 *     data: [],
 *     links: {},
 *     meta: {}
 * }
 *
 * rather than:
 *
 * {
 *     success: true,
 *     message: "...",
 *     data: ...
 * }
 */
async function paginatedApi<T>(endpoint: string): Promise<T> {
  const token = authStorage.getToken();

  const headers = new Headers();

  headers.set("Accept", "application/json");

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
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Unable to load courses.";

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const coursesApi = {
  /**
   * Public course catalog.
   */
  async list(params: CourseListParams = {}): Promise<CourseListResponse> {
    return paginatedApi<CourseListResponse>(
      `/v1/catalog/courses${buildQuery(params)}`,
    );
  },

  /**
   * Public course details.
   */

  async get(courseId: string): Promise<Course> {
    const token = authStorage.getToken();

    const headers = new Headers();

    headers.set("Accept", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(
      `${env.apiUrl}/v1/catalog/courses/${courseId}`,
      {
        method: "GET",
        headers,
      },
    );

    let payload: any = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new ApiError(
        payload?.message ?? "Unable to load course.",
        response.status,
      );
    }

    return payload.data;
  },

  /**
   * Course curriculum.
   */
  async curriculum(courseId: string): Promise<CourseCurriculum> {
    const token = authStorage.getToken();

    const headers = new Headers();

    headers.set("Accept", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(
      `${env.apiUrl}/v1/courses/${courseId}/curriculum`,
      {
        headers,
      },
    );

    let payload: any = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new ApiError(
        payload?.message ?? "Unable to load curriculum.",
        response.status,
      );
    }

    return payload.data;
  },
};
