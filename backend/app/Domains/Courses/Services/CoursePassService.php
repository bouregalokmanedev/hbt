<?php

namespace App\Domains\Courses\Services;

use App\Domains\Assessments\Enums\AssessmentMode;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for "has this learner passed the course?".
 *
 * Course progress, certificate issuance, the gradebook and the learner
 * journey all read this service so they can never disagree about
 * completion again.
 *
 * `evaluateMany()` exists because the dashboard renders a journey card for
 * every enrollment. Calling `evaluate()` in a loop would issue roughly a
 * dozen queries per course; the batch variant loads the same evidence for
 * every course in a fixed number of queries.
 */
final class CoursePassService
{
    /**
     * @return array<string, mixed>
     */
    public function evaluate(Course $course, User $user): array
    {
        $context = $this->buildContext([$course->id], collect([$user]));

        return $this->evaluateWithContext($course, (int) $user->id, $context);
    }

    /**
     * Evaluate every supplied course with a shared, pre-loaded evidence set.
     *
     * @param  iterable<Course>  $courses
     * @return array<string, array<string, mixed>> Keyed by course id.
     */
    public function evaluateMany(iterable $courses, User $user): array
    {
        $courseCollection = collect($courses)->unique('id')->values();

        if ($courseCollection->isEmpty()) {
            return [];
        }

        $context = $this->buildContext(
            $courseCollection->pluck('id')->all(),
            collect([$user]),
        );

        return $courseCollection
            ->mapWithKeys(fn (Course $course) => [
                $course->id => $this->evaluateWithContext($course, (int) $user->id, $context),
            ])
            ->all();
    }

    /**
     * Evaluate one course for many learners, e.g. an instructor gradebook.
     *
     * @param  iterable<User>  $users
     * @return array<int, array<string, mixed>> Keyed by user id.
     */
    public function evaluateForUsers(Course $course, iterable $users): array
    {
        $userCollection = collect($users)->unique('id')->values();

        if ($userCollection->isEmpty()) {
            return [];
        }

        $context = $this->buildContext(
            [$course->id],
            $userCollection,
        );

        return $userCollection
            ->mapWithKeys(fn (User $user) => [
                (int) $user->id => $this->evaluateWithContext($course, (int) $user->id, $context),
            ])
            ->all();
    }

    public function hasPassed(Course $course, User $user): bool
    {
        return (bool) $this->evaluate($course, $user)['passed'];
    }

    /**
     * High-stakes, course-scoped assessment that can certify the learner.
     */
    public function certifyingAssessment(Course $course): ?Assessment
    {
        return Assessment::query()
            ->where('course_id', $course->id)
            ->where('status', AssessmentStatus::PUBLISHED->value)
            ->whereNull('section_id')
            ->whereNull('lesson_id')
            ->whereIn('assessment_mode', [
                AssessmentMode::SUMMATIVE->value,
                AssessmentMode::FINAL->value,
            ])
            ->orderByDesc('is_required')
            ->orderBy('created_at')
            ->first();
    }

    public function certifyingResult(Course $course, User $user): ?AssessmentResult
    {
        $assessment = $this->certifyingAssessment($course);

        if ($assessment === null) {
            return null;
        }

        return AssessmentResult::query()
            ->where('user_id', $user->id)
            ->where('assessment_id', $assessment->id)
            ->where('passed', true)
            ->orderByDesc('score')
            ->first();
    }

    /**
     * Load all evidence needed to evaluate the supplied courses and users.
     *
     * @param  list<string|int>  $courseIds
     * @param  Collection<int, User>  $users
     * @return array<string, mixed>
     */
    private function buildContext(array $courseIds, Collection $users): array
    {
        $userIds = $users->pluck('id')->all();

        $sections = Section::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', SectionStatus::PUBLISHED->value)
            ->with([
                'lessons' => fn ($query) => $query
                    ->where('status', LessonStatus::PUBLISHED->value)
                    ->orderBy('position')
                    ->select(['id', 'section_id', 'title', 'position']),
            ])
            ->orderBy('position')
            ->get(['id', 'course_id', 'title', 'position'])
            ->groupBy('course_id');

        $allLessons = $sections
            ->flatMap(fn (Collection $courseSections) => $courseSections->flatMap->lessons)
            ->values();

        $completedLessonIds = LessonProgress::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('lesson_id', $allLessons->pluck('id'))
            ->whereNotNull('completed_at')
            ->get(['user_id', 'lesson_id'])
            ->groupBy('user_id')
            ->map(fn (Collection $progress) => $progress
                ->pluck('lesson_id')
                ->flip());

        $sectionProgress = SectionProgress::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('section_id', $sections->flatten(1)->pluck('id'))
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $progress) => $progress->keyBy('section_id'));

        $assessments = Assessment::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', AssessmentStatus::PUBLISHED->value)
            ->orderBy('created_at')
            ->get()
            ->groupBy('course_id');

        $assessmentIds = $assessments
            ->flatten(1)
            ->pluck('id')
            ->all();

        $results = AssessmentResult::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('assessment_id', $assessmentIds)
            ->orderByDesc('score')
            ->orderByDesc('completed_at')
            ->get()
            ->groupBy('user_id');

        $bestResults = $results->map(
            fn (Collection $userResults) => $userResults->unique('assessment_id')->keyBy('assessment_id')
        );

        $passedResults = $results->map(
            fn (Collection $userResults) => $userResults
                ->where('passed', true)
                ->unique('assessment_id')
                ->keyBy('assessment_id')
        );

        $quizLinks = DB::table('assessment_quizzes')
            ->whereIn('assessment_id', $assessmentIds)
            ->where('is_required', true)
            ->orderBy('position')
            ->get(['assessment_id', 'quiz_id']);

        $quizzes = Quiz::query()
            ->whereIn('id', $quizLinks->pluck('quiz_id')->unique()->all())
            ->where('status', 'published')
            ->get()
            ->keyBy('id');

        $quizzesByAssessment = $quizLinks
            ->groupBy('assessment_id')
            ->map(fn (Collection $links) => $links
                ->map(fn ($link) => $quizzes->get($link->quiz_id))
                ->filter()
                ->values());

        $bestQuizAttempts = QuizAttempt::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('quiz_id', $quizzes->keys()->all())
            ->where('status', QuizAttemptStatus::SUBMITTED->value)
            ->orderByDesc('percentage')
            ->orderByDesc('attempt_number')
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $attempts) => $attempts
                ->unique('quiz_id')
                ->keyBy('quiz_id'));

        $practicalAssignments = CourseDiagnosticScenario::query()
            ->whereIn('course_id', $courseIds)
            ->where('is_required', true)
            ->with('scenario')
            ->orderBy('position')
            ->get()
            ->groupBy('course_id')
            ->map(fn (Collection $assignments) => $assignments
                ->filter(fn (CourseDiagnosticScenario $assignment) => $assignment->scenario !== null
                    && $assignment->scenario->status === DiagnosticScenarioStatus::PUBLISHED)
                ->values());

        $practicalProgress = CourseDiagnosticProgress::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('course_id', $courseIds)
            ->whereIn(
                'diagnostic_scenario_id',
                $practicalAssignments
                    ->flatten(1)
                    ->pluck('diagnostic_scenario_id')
                    ->unique()
                    ->all(),
            )
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $progress) => $progress
                ->keyBy(fn (CourseDiagnosticProgress $row) => $row->course_id.':'.$row->diagnostic_scenario_id));

        $certificates = Certificate::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('course_id', $courseIds)
            ->whereNull('revoked_at')
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $userCertificates) => $userCertificates
                ->unique('course_id')
                ->keyBy('course_id'));

        return [
            'sections' => $sections,
            'completed_lesson_ids' => $completedLessonIds,
            'section_progress' => $sectionProgress,
            'assessments' => $assessments,
            'best_results' => $bestResults,
            'passed_results' => $passedResults,
            'quizzes_by_assessment' => $quizzesByAssessment,
            'best_quiz_attempts' => $bestQuizAttempts,
            'practical_assignments' => $practicalAssignments,
            'practical_progress' => $practicalProgress,
            'certificates' => $certificates,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function evaluateWithContext(Course $course, int $userId, array $context): array
    {
        /** @var Collection<int, Section> $sections */
        $sections = $context['sections']->get($course->id, collect());

        /** @var Collection<string, int> $completedLessonIds */
        $completedLessonIds = $context['completed_lesson_ids']->get($userId, collect());

        /** @var Collection<string, SectionProgress> $sectionProgress */
        $sectionProgress = $context['section_progress']->get($userId, collect());

        /** @var Collection<string, AssessmentResult> $bestResults */
        $bestResults = $context['best_results']->get($userId, collect());

        /** @var Collection<string, AssessmentResult> $passedResults */
        $passedResults = $context['passed_results']->get($userId, collect());

        /*
         * Order matters: the learner's next lesson must follow the same
         * section-then-lesson path the access gate enforces. Ordering the
         * lessons query by position alone interleaves positions across
         * sections and can point at a lesson that is still locked.
         */
        $lessons = $sections
            ->flatMap(fn (Section $section) => $section->lessons)
            ->values();

        $courseCompletedLessonIds = $lessons
            ->filter(fn (Lesson $lesson) => $completedLessonIds->has($lesson->id))
            ->pluck('id')
            ->values()
            ->all();

        $sectionsComplete = $sections->every(
            fn (Section $section) => (int) ($sectionProgress->get($section->id)?->progress_percentage ?? 0) >= 100
        );

        $lessonsComplete = $lessons->every(
            fn (Lesson $lesson) => in_array($lesson->id, $courseCompletedLessonIds, true)
        );

        // Legacy courses (and some imports) only carry section progress.
        // When a course has no published lessons at all, section progress is
        // the only available evidence, so it becomes the lesson requirement.
        $lessonsPassed = $lessons->isEmpty()
            ? $sections->isNotEmpty() && $sectionsComplete
            : $lessonsComplete;

        /** @var Collection<int, Assessment> $courseAssessments */
        $courseAssessments = $context['assessments']->get($course->id, collect());

        $assessments = $courseAssessments
            ->where('is_required', true)
            ->values();

        $assessmentItems = $assessments->map(function (Assessment $assessment) use ($bestResults): array {
            $result = $bestResults->get($assessment->id);

            return [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'scope' => $assessment->scope(),
                'section_id' => $assessment->section_id,
                'lesson_id' => $assessment->lesson_id,
                'minimum_score' => (int) $assessment->minimum_score,
                'score' => $result !== null ? (int) round((float) $result->score) : null,
                'attempted' => $result !== null,
                'passed' => $result !== null && (bool) $result->passed,
            ];
        })->values();

        $quizItems = $this->quizRequirements(
            $assessments,
            $context['quizzes_by_assessment'],
            $context['best_quiz_attempts']->get($userId, collect()),
        );

        $practicalItems = $this->practicalRequirements(
            $course,
            $context['practical_assignments'],
            $context['practical_progress']->get($userId, collect()),
        );

        $assessmentsPassed = $assessmentItems->every(fn (array $item) => $item['passed']);
        $quizzesPassed = $quizItems->every(fn (array $item) => $item['passed']);
        $practicalsPassed = $practicalItems->every(fn (array $item) => $item['passed']);

        $passed = $sections->isNotEmpty()
            && $lessonsPassed
            && $assessmentsPassed
            && $quizzesPassed
            && $practicalsPassed;

        /** @var Certificate|null $certificate */
        $certificate = $context['certificates']->get($userId, collect())->get($course->id);

        $certifyingAssessment = $courseAssessments
            ->filter(fn (Assessment $assessment) => $assessment->section_id === null
                && $assessment->lesson_id === null
                && in_array($assessment->assessment_mode, [
                    AssessmentMode::SUMMATIVE,
                    AssessmentMode::FINAL,
                ], true))
            ->sortByDesc(fn (Assessment $assessment) => (int) $assessment->is_required)
            ->first();

        $certifyingResult = $certifyingAssessment !== null
            ? $passedResults->get($certifyingAssessment->id)
            : null;

        $certificateReady = $passed
            && $certifyingAssessment !== null
            && $certifyingResult !== null;

        $requirements = [
            [
                'key' => 'sections',
                'label' => 'Published sections',
                'required' => $sections->count(),
                'completed' => $sections->count(),
                'passed' => $sections->isNotEmpty(),
            ],
            [
                'key' => 'lessons',
                'label' => 'Lessons',
                'required' => $lessons->count(),
                'completed' => count($courseCompletedLessonIds),
                'passed' => $lessonsPassed,
            ],
            [
                'key' => 'assessments',
                'label' => 'Required assessments',
                'required' => $assessmentItems->count(),
                'completed' => $assessmentItems->where('passed', true)->count(),
                'passed' => $assessmentsPassed,
            ],
            [
                'key' => 'quizzes',
                'label' => 'Required quizzes',
                'required' => $quizItems->count(),
                'completed' => $quizItems->where('passed', true)->count(),
                'passed' => $quizzesPassed,
            ],
            [
                'key' => 'practicals',
                'label' => 'Practical assessments',
                'required' => $practicalItems->count(),
                'completed' => $practicalItems->where('passed', true)->count(),
                'passed' => $practicalsPassed,
            ],
        ];

        return [
            'passed' => $passed,
            'certificate_ready' => $certificateReady,
            'certificate' => $certificate !== null ? [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at?->toISOString(),
            ] : null,
            'requirements' => $requirements,
            'lessons' => [
                'required' => $lessons->count(),
                'completed' => count($courseCompletedLessonIds),
                'passed' => $lessonsPassed,
                'next' => $lessons
                    ->first(fn (Lesson $lesson) => ! in_array($lesson->id, $courseCompletedLessonIds, true))
                    ?->only(['id', 'title', 'section_id']),
            ],
            'sections' => $sections->map(function (Section $section) use ($sectionProgress): array {
                $progress = $sectionProgress->get($section->id);

                return [
                    'id' => $section->id,
                    'title' => $section->title,
                    'position' => $section->position,
                    'progress_percentage' => (int) ($progress?->progress_percentage ?? 0),
                    'completed' => (int) ($progress?->progress_percentage ?? 0) >= 100,
                ];
            })->values()->all(),
            'assessments' => $assessmentItems->all(),
            'quizzes' => $quizItems->all(),
            'practicals' => $practicalItems->all(),
            'final_assessment' => $certifyingAssessment !== null ? [
                'id' => $certifyingAssessment->id,
                'title' => $certifyingAssessment->title,
                'minimum_score' => (int) $certifyingAssessment->minimum_score,
                'passed' => $certifyingResult !== null,
                'score' => $certifyingResult !== null ? (int) round((float) $certifyingResult->score) : null,
            ] : null,
            'next_step' => $this->nextStep(
                $course,
                $lessons,
                $courseCompletedLessonIds,
                $assessmentItems,
                $quizItems,
                $certifyingAssessment,
                $certifyingResult,
                $certificate,
                $passed,
            ),
        ];
    }

    /**
     * @param  Collection<int, Assessment>  $assessments
     * @param  Collection<string, Collection<int, Quiz>>  $quizzesByAssessment
     * @param  Collection<string, QuizAttempt>  $bestQuizAttempts
     * @return Collection<int, array<string, mixed>>
     */
    private function quizRequirements(
        $assessments,
        Collection $quizzesByAssessment,
        Collection $bestQuizAttempts,
    ) {
        $items = collect();

        foreach ($assessments as $assessment) {
            $quizzes = $quizzesByAssessment->get($assessment->id, collect());

            foreach ($quizzes as $quiz) {
                /** @var Quiz $quiz */
                $best = $bestQuizAttempts->get($quiz->id);

                $requiredScore = (int) $assessment->required_quiz_score;

                $items->push([
                    'id' => $quiz->id,
                    'assessment_id' => $assessment->id,
                    'section_id' => $quiz->section_id,
                    'title' => $quiz->title,
                    'required_score' => $requiredScore,
                    'score' => $best?->percentage !== null ? (int) $best->percentage : null,
                    'attempted' => $best !== null,
                    'passed' => $best !== null && (int) $best->percentage >= $requiredScore,
                ]);
            }
        }

        return $items->unique('id')->values();
    }

    /**
     * @param  Collection<string, Collection<int, CourseDiagnosticScenario>>  $practicalAssignments
     * @param  Collection<string, CourseDiagnosticProgress>  $practicalProgress
     * @return Collection<int, array<string, mixed>>
     */
    private function practicalRequirements(
        Course $course,
        Collection $practicalAssignments,
        Collection $practicalProgress,
    ) {
        $assignments = $practicalAssignments->get($course->id, collect());

        return $assignments->map(function (CourseDiagnosticScenario $assignment) use ($course, $practicalProgress): array {
            $row = $practicalProgress->get(
                $course->id.':'.$assignment->diagnostic_scenario_id,
            );
            $minimum = (int) ($assignment->min_score ?? $assignment->scenario->passing_score ?? 70);
            $score = $row !== null ? (int) $row->best_score : null;

            return [
                'id' => $assignment->scenario->id,
                'title' => $assignment->scenario->title,
                'minimum_score' => $minimum,
                'score' => $score,
                'attempted' => $row !== null,
                'passed' => $row !== null && ((bool) $row->passed || $score >= $minimum),
            ];
        })->values();
    }

    /**
     * @param  Collection<int, Lesson>  $lessons
     * @param  list<string>  $completedLessonIds
     * @param  Collection<int, array<string, mixed>>  $assessments
     * @param  Collection<int, array<string, mixed>>  $quizzes
     * @return array<string, mixed>|null
     */
    private function nextStep(
        Course $course,
        $lessons,
        array $completedLessonIds,
        $assessments,
        $quizzes,
        ?Assessment $certifyingAssessment,
        ?AssessmentResult $certifyingResult,
        ?Certificate $certificate,
        bool $coursePassed,
    ): ?array {
        $nextLesson = $lessons->first(
            fn (Lesson $lesson) => ! in_array($lesson->id, $completedLessonIds, true)
        );

        if ($nextLesson !== null) {
            return [
                'type' => 'lesson',
                'id' => $nextLesson->id,
                'title' => $nextLesson->title,
                'path' => "/courses/{$course->id}/lessons/{$nextLesson->id}",
            ];
        }

        $nextQuiz = $quizzes->first(fn (array $item) => ! $item['passed']);

        if ($nextQuiz !== null) {
            return [
                'type' => 'quiz',
                'id' => $nextQuiz['id'],
                'title' => $nextQuiz['title'],
                'path' => "/courses/{$course->id}/quizzes/{$nextQuiz['id']}",
            ];
        }

        $nextAssessment = $assessments->first(fn (array $item) => ! $item['passed']);

        if ($nextAssessment !== null) {
            return [
                'type' => 'assessment',
                'id' => $nextAssessment['id'],
                'title' => $nextAssessment['title'],
                'path' => "/assessments/{$nextAssessment['id']}/exam",
            ];
        }

        if ($coursePassed && $certifyingAssessment !== null && $certifyingResult === null) {
            return [
                'type' => 'assessment',
                'id' => $certifyingAssessment->id,
                'title' => $certifyingAssessment->title,
                'path' => "/assessments/{$certifyingAssessment->id}/exam",
            ];
        }

        if ($certificate !== null) {
            return [
                'type' => 'certificate',
                'id' => $certificate->id,
                'title' => 'Your certificate is ready',
                'path' => '/certificates',
            ];
        }

        if ($coursePassed) {
            return [
                'type' => 'completed',
                'id' => null,
                'title' => 'Course completed',
                'path' => "/courses/{$course->id}",
            ];
        }

        return null;
    }
}
