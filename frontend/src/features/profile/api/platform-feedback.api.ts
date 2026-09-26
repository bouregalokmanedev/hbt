import { api } from "@/lib/api/client";

export interface PlatformFeedbackPayload {
    rating: number;
    comment?: string;
    area?: string;
    lab?: string;
}

export interface PlatformFeedbackReview {
    id: string;
    rating: number;
    comment: string | null;
    lab: string | null;
    created_at: string | null;
    author: {
        name: string;
        avatar: string | null;
    };
}

export interface PlatformFeedbackMeta {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface PlatformFeedbackList {
    summary: { average: number; count: number };
    reviews: PlatformFeedbackReview[];
    meta: PlatformFeedbackMeta;
}

/** Review scope: one of the five benches, lab-agnostic reviews, or everything. */
export type PlatformFeedbackLabFilter = "all" | "general" | SimulatorLabId;

export type SimulatorLabId =
    | "scanner"
    | "multimeter"
    | "oscilloscope"
    | "location"
    | "schematic";

export const SIMULATOR_LABS: SimulatorLabId[] = [
    "scanner",
    "multimeter",
    "oscilloscope",
    "location",
    "schematic",
];

export function submitPlatformFeedback(data: PlatformFeedbackPayload) {
    return api("/v1/platform/feedback", {
        method: "POST",
        body: data,
    });
}

export function fetchPlatformFeedback(
    area = "simulator",
    lab: PlatformFeedbackLabFilter = "all",
    page = 1,
) {
    const params = new URLSearchParams({
        area,
        lab,
        page: String(page),
    });

    return api<PlatformFeedbackList>(
        `/v1/platform/feedback?${params.toString()}`,
    );
}
