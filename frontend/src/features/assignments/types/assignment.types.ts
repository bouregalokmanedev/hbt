export type AssignmentStatus = "draft" | "published";
export type AssignmentSubmissionStatus = "submitted" | "graded";

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  status: AssignmentSubmissionStatus;
  content: string | null;
  link_url: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  is_late: boolean;
}

export interface LearnerAssignment {
  id: string;
  course_id: string;
  course_title?: string | null;
  title: string;
  slug: string;
  instructions: string;
  max_points: number;
  due_at: string | null;
  allow_late_submissions: boolean;
  is_overdue: boolean;
  is_late: boolean;
  submission: AssignmentSubmission | null;
}

export interface InstructorAssignment {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  instructions: string;
  max_points: number;
  due_at: string | null;
  allow_late_submissions: boolean;
  status: AssignmentStatus;
  published_at: string | null;
  submissions_count: number;
  graded_count: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
}

export interface InstructorAssignmentStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
}

export interface InstructorAssignmentSubmission extends AssignmentSubmission {
  student: InstructorAssignmentStudent | null;
}
