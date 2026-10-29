import type { LearnerAssignment } from "../types/assignment.types";

export type LearnerAssignmentState =
  | "graded"
  | "submitted"
  | "overdue"
  | "assigned";

export function learnerAssignmentState(
  assignment: LearnerAssignment,
): LearnerAssignmentState {
  if (assignment.submission?.status === "graded") {
    return "graded";
  }

  if (assignment.submission) {
    return "submitted";
  }

  return assignment.is_overdue ? "overdue" : "assigned";
}

export function formatAssignmentDate(
  value: string | null,
  language: string,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatted = new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

  // Keep the numeric date/time in reading order when embedded in RTL copy.
  return language === "ar" ? `\u2066${formatted}\u2069` : formatted;
}
