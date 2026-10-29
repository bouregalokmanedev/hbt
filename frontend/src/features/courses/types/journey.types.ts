export type JourneyNextStepType =
  | "lesson"
  | "quiz"
  | "assessment"
  | "certificate"
  | "completed";

export interface JourneyNextStep {
  type: JourneyNextStepType;
  id: string | null;
  title: string;
  path: string;
}

export interface JourneyRequirement {
  key: "sections" | "lessons" | "assessments" | "quizzes" | "practicals" | string;
  label: string;
  required: number;
  completed: number;
  passed: boolean;
}

export interface JourneyAssessment {
  id: string;
  title: string;
  scope: string;
  section_id: string | null;
  lesson_id: string | null;
  minimum_score: number;
  score: number | null;
  attempted: boolean;
  passed: boolean;
}

export interface JourneyQuiz {
  id: string;
  assessment_id: string;
  section_id: string | null;
  title: string;
  required_score: number;
  score: number | null;
  attempted: boolean;
  passed: boolean;
}

export interface JourneyPractical {
  id: string;
  title: string;
  minimum_score: number;
  score: number | null;
  attempted: boolean;
  passed: boolean;
}

export interface CourseJourney {
  passed: boolean;
  certificate_ready: boolean;
  certificate: {
    id: string;
    certificate_number: string;
    issued_at: string | null;
  } | null;
  requirements: JourneyRequirement[];
  lessons: {
    required: number;
    completed: number;
    passed: boolean;
    next: { id: string; title: string; section_id: string } | null;
  };
  sections: Array<{
    id: string;
    title: string;
    position: number;
    progress_percentage: number;
    completed: boolean;
  }>;
  assessments: JourneyAssessment[];
  quizzes: JourneyQuiz[];
  practicals: JourneyPractical[];
  final_assessment: {
    id: string;
    title: string;
    minimum_score: number;
    passed: boolean;
  } | null;
  next_step: JourneyNextStep | null;
}
