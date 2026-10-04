import { api } from "@/lib/api/client";
import type { AdminBroadcast } from "@/features/admin/types/admin";
import type { Conversation } from "@/features/messages/api/messages.api";

export interface StaffNewsPayload {
  title: string;
  message: string;
  action_url?: string;
  replies_enabled?: boolean;
  quick_replies?: string[];
}

export interface StaffRoomMember {
  id: string;
  name: string;
  /** Present only when roles were eager loaded on the conversation. */
  role?: string | null;
}

/**
 * Staff Hub endpoints. Both are guarded by the `role:Admin|Super Admin|
 * Support|Instructor` middleware, so students can never reach them.
 */
export const staffHubApi = {
  /** Idempotent: creates the shared room on first call, then just returns it. */
  getRoom: () => api<Conversation>("/v1/staff-hub/room"),

  /**
   * Publish an announcement to every member of staff. The backend forces
   * `audience: "staff"` regardless of what is sent, so students can never be
   * reached through this endpoint.
   */
  publishNews: (payload: StaffNewsPayload) =>
    api<AdminBroadcast>("/v1/staff-hub/news", { method: "POST", body: payload }),
};
