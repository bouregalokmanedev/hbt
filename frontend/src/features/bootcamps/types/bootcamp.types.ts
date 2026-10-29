export type BootcampStatus = "draft" | "published" | "archived" | string;

export type BootcampDurationUnit = "days" | "weeks" | "hours" | "minutes";

export type BootcampLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all levels"
  | string;

export type BootcampSite =
  | "el_oued"
  | "algiers"
  | "saudi"
  /*
   * Legacy identifiers stay in the union so historical registrations can
   * still be rendered. New registrations only offer BOOTCAMP_SITES below.
   */
  | "algiers_hydra"
  | "algiers_centre"
  | "oran"
  | "constantine"
  | "online";

export const BOOTCAMP_CAMPUSES = [
  { site: "el_oued", location: "EL-Oued Campus" },
  { site: "algiers", location: "Algiers Campus" },
  { site: "saudi", location: "Saudi Campus" },
] as const satisfies ReadonlyArray<{ site: BootcampSite; location: string }>;

export type BootcampPaymentMethod = "cash" | "visa_card" | "bank_transfer";

export type BootcampMediaType =
  | "thumbnail"
  | "cover_image"
  | "preview_video";

export type BootcampRegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

export interface BootcampIncludes {
  challenges: boolean;
  resources: boolean;
  quizzes: boolean;
  support: boolean;
  certificate: boolean;
  final_project: boolean;
  classrooms: boolean;
}

export interface BootcampInstructor {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
}

export interface BootcampSchedule {
  id: string;
  bootcamp_id: string;
  starts_at: string;
  ends_at: string;
  is_available: boolean;
  bootcamp?: BootcampSummary;
}

export interface BootcampSummary {
  id: string;
  title: string;
  slug: string;
  location: string;
  price: number;
  currency: string;
  level: BootcampLevel;
  duration_value: number;
  duration_unit: BootcampDurationUnit;
}

export interface BootcampLesson {
  id: string;
  title: string;
  classroom_count: number;
  duration_minutes: number;
  position: number;
}

export interface BootcampSection {
  id: string;
  title: string;
  position: number;
  lessons: BootcampLesson[];
}

export interface Bootcamp {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string;
  duration_value: number;
  duration_unit: BootcampDurationUnit;
  location: string;
  price: number;
  currency: string;
  level: BootcampLevel;
  includes: BootcampIncludes;
  status: BootcampStatus;
  thumbnail: string | null;
  cover_image: string | null;
  preview_video: string | null;
  brochure_available: boolean;
  brochure_name: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  registered_count: number;
  instructor?: BootcampInstructor | null;
  schedules: BootcampSchedule[];
  sections: BootcampSection[];
}

export interface BootcampPaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface BootcampPaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  path: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
}

export interface BootcampListResponse {
  data: Bootcamp[];
  links: BootcampPaginationLinks;
  meta: BootcampPaginationMeta;
}

export interface BootcampRegistration {
  id: string;
  bootcamp_id: string;
  bootcamp_schedule_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  site: BootcampSite;
  payment_method: BootcampPaymentMethod;
  terms_accepted: boolean;
  status: BootcampRegistrationStatus;
  created_at: string | null;
  schedule?: BootcampSchedule;
}

export interface BootcampRegistrationListResponse {
  data: BootcampRegistration[];
  links: BootcampPaginationLinks;
  meta: BootcampPaginationMeta;
}

export interface BootcampRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  scheduleId: string;
  site: BootcampSite;
  paymentMethod: BootcampPaymentMethod;
  termsAccepted: boolean;
  website?: string;
  turnstileToken?: string | null;
}

export interface BootcampCurriculumLessonInput {
  id?: string;
  title: string;
  classroom_count: number;
  duration_minutes: number;
}

export interface BootcampCurriculumSectionInput {
  id?: string;
  title: string;
  lessons: BootcampCurriculumLessonInput[];
}

export interface InstructorBootcampPayload {
  title: string;
  short_description: string | null;
  description: string;
  duration_value: number;
  duration_unit: BootcampDurationUnit;
  location: string;
  price: number;
  currency: string;
  level: BootcampLevel;
  includes: BootcampIncludes;
}

export interface BootcampScheduleInput {
  starts_at: string;
  ends_at: string;
}

export const BOOTCAMP_SITES: BootcampSite[] = BOOTCAMP_CAMPUSES.map(
  ({ site }) => site,
);

export const BOOTCAMP_PAYMENT_METHODS: BootcampPaymentMethod[] = [
  "cash",
  "visa_card",
  "bank_transfer",
];

export const BOOTCAMP_INCLUDE_KEYS: Array<keyof BootcampIncludes> = [
  "challenges",
  "resources",
  "quizzes",
  "support",
  "certificate",
  "final_project",
  "classrooms",
];
