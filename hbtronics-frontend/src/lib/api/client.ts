import {
    env,
} from "@/config/env";

import {
    authStorage,
} from "@/lib/storage/auth-storage";

import {
    ApiError,
} from "./errors";

import type {
    ApiResponse,
} from "./types";

interface RequestOptions
    extends Omit<
        RequestInit,
        "body"
    > {
    body?: unknown;
}

export async function api<T>(
    endpoint: string,
    options: RequestOptions = {},
): Promise<T> {
    const token =
        authStorage.getToken();

    const headers = new Headers(
        options.headers,
    );

    headers.set(
        "Accept",
        "application/json",
    );

    if (
        options.body !== undefined
    ) {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }

    const response = await fetch(
        `${env.apiUrl}${endpoint}`,
        {
            ...options,
            headers,
            body:
                options.body !== undefined
                    ? JSON.stringify(
                          options.body,
                      )
                    : undefined,
        },
    );

    let payload: ApiResponse<T> | null =
        null;

    try {
        payload =
            (await response.json()) as ApiResponse<T>;
    } catch {
        payload = null;
    }

    if (
        !response.ok ||
        !payload ||
        payload.success === false
    ) {
        throw new ApiError(
            payload?.message ??
                "Something went wrong.",
            response.status,
            payload &&
            "errors" in payload
                ? payload.errors
                : undefined,
        );
    }

    return payload.data;
}