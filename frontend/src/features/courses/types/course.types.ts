import { Enrollment } from "@/features/enrollments/types/enrollment.types";

export type CourseDifficulty =
  "beginner" | "intermediate" | "advanced" | string;

export type CourseStatus =
  "draft" | "pending_review" | "published" | "archived" | string;

export type CourseVisibility = "public" | "private" | string;

export interface Course {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  language: string;
  difficulty: string;
  duration_minutes: number;
  price: number;
  discount_price: number | null;
  currency: string;
  is_free: boolean;
  status: string;
  visibility: string;
  thumbnail: string | null;
  cover_image: string | null;
  preview_video: string | null;
  metadata?: {
    requirements?: string[];
  } | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;

  enrollment?: Enrollment | null;
}

export interface CourseCurriculumCourse {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export interface LessonProgress {
  id: string;
  progress_percentage: number;
  time_spent: number;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
}

export interface CourseLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content?: string | null;
  position: number;
  status: string;
  duration_minutes: number;
  is_preview: boolean;

  progress: LessonProgress | null;
}

export interface CourseSectionQuiz {
  id: string;
  title: string;
  questions_count: number;
  pass_percentage: number;
  attempt_status?: string | null;
  passed?: boolean | null;
}

export interface CourseSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
  status: string;

  lessons: CourseLesson[];
  quizzes?: CourseSectionQuiz[];
}

export interface CourseCurriculum {
  course: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };

  sections: CourseSection[];
}
export interface CurriculumLesson {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  content?: string | null;
  duration_minutes: number;
  is_preview: boolean;
  status?: string;
}

export interface CurriculumSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
  status: string;
  lessons: CurriculumLesson[];
}

export type EnrollmentStatus = "active" | "completed" | "cancelled" | string;

export interface CourseEnrollment {
  id: string;

  user_id: string;
  course_id: string;

  status: EnrollmentStatus;

  enrolled_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;

  created_at: string | null;
  updated_at: string | null;
}
