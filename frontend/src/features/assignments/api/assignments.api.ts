import { api } from "@/lib/api/client";

import type { AssignmentSubmission, LearnerAssignment } from "../types/assignment.types";

export async function getMyAssignments(limit = 10): Promise<LearnerAssignment[]> {
  const assignments = await api<LearnerAssignment[]>(
    `/v1/assignments?limit=${limit}`,
  );

  return assignments ?? [];
}

export async function getCourseAssignments(
  courseId: string,
): Promise<LearnerAssignment[]> {
  const assignments = await api<LearnerAssignment[]>(
    `/v1/courses/${courseId}/assignments`,
  );

  return assignments ?? [];
}

export async function getCourseAssignment(
  courseId: string,
  assignmentId: string,
): Promise<LearnerAssignment> {
  return api<LearnerAssignment>(
    `/v1/courses/${courseId}/assignments/${assignmentId}`,
  );
}

export async function submitAssignment(
  courseId: string,
  assignmentId: string,
  payload: { content?: string | null; link_url?: string | null },
): Promise<AssignmentSubmission> {
  return api<AssignmentSubmission>(
    `/v1/courses/${courseId}/assignments/${assignmentId}/submission`,
    { method: "POST", body: payload },
  );
}
