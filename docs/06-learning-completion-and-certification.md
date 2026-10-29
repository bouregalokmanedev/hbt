# Learning completion, certificates, and gating

This document is the contract for course completion, certificate issuance, and
the server-side gates that protect learning content. It is the reference used
by `CoursePassService`, the learner journey endpoint, the gradebook,
certificates, and admin analytics.

## Single source of truth

`App\Domains\Courses\Services\CoursePassService` is the only place that decides
whether a learner has passed a course.

Course progress, enrollment completion, the gradebook, certificate issuance,
the learner journey, and admin completion analytics all read the same
evaluation. Do not re-derive "completed" from progress percentages in a
controller, listener, or UI component.

### Pass rule

A learner passes a course when **all** of the following are true:

1. The course has at least one published section.
2. Every published lesson in those sections has a `lesson_progress` row with
   `completed_at` set.
3. Every published, required, course-scoped assessment has a passed result.
4. Every required quiz linked to those assessments has a submitted attempt at
   or above the assessment's `required_quiz_score`.
5. Every required practical diagnostic scenario is passed.

When a course has no published lessons at all (legacy/imported content), every
published section must instead be at 100% progress.

`CoursePassService::evaluate()` returns:

| Field | Meaning |
|---|---|
| `passed` | The full pass rule above |
| `certificate_ready` | `passed` plus a passed course-scoped summative/final assessment |
| `certificate` | The learner's active certificate, if one exists |
| `requirements` | `sections`, `lessons`, `assessments`, `quizzes`, `practicals` with required/completed/passed counts |
| `lessons.next` | The first incomplete published lesson |
| `sections` | Per-section progress and completion |
| `assessments` / `quizzes` / `practicals` | Required item evidence and best score |
| `final_assessment` | The certifying assessment and the learner's result |
| `next_step` | Canonical CTA: `lesson`, `quiz`, `assessment`, `certificate`, or `completed` |

### Completion side effects

`CourseProgressService::sync()` writes `course_progress.completed_at` only when
`CoursePassService` reports `passed`. That write is what:

- marks the enrollment `completed`,
- fires `CourseCompleted`,
- lets admin learning analytics count a real completion instead of a section
  percentage,
- keeps the gradebook's `course_passed` / `certificate_ready` truthful.

## Certificate rule

Certificates are issued by
`App\Domains\Certificates\Actions\IssueCertificateAction` and by the
`AssessmentPassed` listener. A certificate requires:

1. A passed assessment result.
2. `assessment_mode` of `summative` or `final`.
3. Course scope (`section_id` and `lesson_id` are both null).
4. An active or completed enrollment in the assessment's course.
5. A full `CoursePassService` pass.
6. No existing active certificate for that learner and course (idempotent).

Section- and lesson-scoped assessments can never certify a whole course, even
when they are summative. Low-stakes modes (`diagnostic`, `formative`,
`practice`) never issue certificates.

## Learner journey endpoint

`GET /api/v1/courses/{course}/journey` is the learner's "where am I?" API. It
requires full course access and returns the canonical pass evaluation plus the
enrollment and stored progress. Course details, My Courses, and certificate
cards read this instead of recomputing next actions in React.

The endpoint syncs stored progress before returning it. Completion is
idempotent: repeated reads cannot mint a second certificate or move the
original `completed_at` timestamp.

## Server-side gates

| Area | Service | Rule |
|---|---|---|
| Lessons | `LessonAccessService` | Lessons unlock in published section/lesson order; completed enrollments retain access |
| Video lessons | `LessonWatchEvidenceService` | Completion needs accumulated watched evidence; `time_spent` is cumulative watched seconds, `video_position` is resume position |
| Quizzes | `QuizAccessService` | Published course/section, active or completed enrollment, and an in-progress attempt owned by the learner |
| Assessments | `AssessmentAccessibleSpecification` | Published course and active/completed enrollment; draft courses and cancelled enrollments are invisible |
| Assessment attempts | `StartAssessmentAttemptAction` | Eligibility, max attempts, active-attempt reuse, and timeout cooldown |
| Assessment answers | `SaveAssessmentAttemptAnswersAction` | In-progress, unexpired attempt; question must belong to the assessment |
| Assessment submit | `AssessmentAttemptController` | Required questions must contain real content; blank or incomplete answers are rejected |

Lesson and assessment completion events (`SyncCourseProgressAfterAssessment`,
`SyncCourseProgressAfterPractical`) re-run the canonical pass evaluation, so a
pass can never depend on which page the learner happened to visit last.

## Assessment answer contract

Autosave (`PUT /v1/assessments/{assessment}/attempts/{attempt}/answers/{question}`)
and submit (`POST .../submit`) accept the same payload shapes:

| Type | Payload |
|---|---|
| `single_choice`, `multiple_choice`, `true_false` | `option_ids: string[]` (or legacy `selected_option_ids`) |
| `short_answer`, `long_answer` | `value: string` |
| `numeric` | `value: number` |
| `ordering` | `ordered_ids: string[]` — every option exactly once |
| `matching` | `matches: { left: right }` or `[{ left, right }]` |

Every answer may carry `confidence_level`: `guessing`,
`somewhat_confident`, `confident`, or `very_confident`.

The attempt resource exposes question `type`, `points`, `required`, options,
and safe matching columns. It never exposes `answer_key`, and ordering options
are deterministically shuffled so resuming an attempt preserves the same
order without leaking the solution.

The assessment catalogue exposes per-learner `attempt_history`:
`attempts_count`, `best_score`, `passed`, `remaining_attempts`,
`in_progress_attempt_id`, `cooldown_until`, `can_start`, and `latest`.

## Analytics

Admin learning analytics count completions from
`course_progress.completed_at`. Because that column is now written only by the
canonical pass rule, completion rates and "by course" completion counts reflect
real course passes rather than partial progress. Certificate counts are read
from `certificates` and therefore exclude revoked certificates at the query
layer where required.

## Verifying changes

```bash
cd backend
php -d memory_limit=1G vendor/bin/pest \
  tests/Feature/Domains/Course/CourseJourneyCertificationTest.php \
  tests/Feature/Domains/Certificates \
  tests/Feature/Domains/Assessments

cd ../frontend
npx tsc -b
npm test
npm run build
```
